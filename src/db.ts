import Dexie, { type Table, type Transaction } from "dexie";
import type {
  ImmunizationRecord,
  Patient,
  SyncItem,
  User,
  Visit,
} from "./types";

export const syncState = { applyingRemote: false };

class PrimaDB extends Dexie {
  patients!: Table<Patient, string>;
  immunizations!: Table<ImmunizationRecord, string>;
  visits!: Table<Visit, string>;
  syncQueue!: Table<SyncItem, number>;
  users!: Table<User, string>;

  constructor() {
    super("prima");
    this.version(1).stores({
      patients:
        "id, &cardNumber, name, phone, nhisNumber, dob, gender, createdAt, [name+dob+villageKey]",
      immunizations: "id, patientId, nextDueDate",
      visits: "id, patientId, nextDueDate, createdAt",
      syncQueue: "++id, table, recordId",
      users: "id, &username",
    });
  }
}

export const db = new PrimaDB();

function enqueue(
  table: SyncItem["table"],
  recordId: string,
  trans: Transaction,
) {
  if (syncState.applyingRemote) return;
  const item: SyncItem = {
    table,
    recordId,
    attempts: 0,
    status: "pending",
    createdAt: Date.now(),
  };
  trans.table("syncQueue").add(item);
}

db.patients.hook("creating", (_key, obj, trans) => {
  enqueue("patients", obj.id, trans);
});
db.immunizations.hook("creating", (_key, obj, trans) => {
  enqueue("immunizations", obj.id, trans);
});
