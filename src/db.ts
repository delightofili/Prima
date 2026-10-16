import Dexie, { type Table, type Transaction } from "dexie";
import { config } from "./lib/config";
import { toE164 } from "./lib/utils";
import { nextLabelFor } from "./lib/vaccines";
import type {
  ImmunizationRecord,
  MetaItem,
  Patient,
  SyncItem,
  User,
  Visit,
  Guardian,
  Reminder,
} from "./types";

interface TxFlags {
  remote?: boolean;
}

class PrimaDB extends Dexie {
  patients!: Table<Patient, string>;
  immunizations!: Table<ImmunizationRecord, string>;
  visits!: Table<Visit, string>;
  syncQueue!: Table<SyncItem, number>;
  users!: Table<User, string>;
  meta!: Table<MetaItem, string>;
  guardians!: Table<Guardian, string>;
  reminders!: Table<Reminder, string>;

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
    this.version(2).stores({
      visits: "id, patientId, visitDate, nextDueDate, diagnosisCode, createdAt",
    });
    this.version(3)
      .stores({ meta: "key" })
      .upgrade(async (tx) => {
        const now = Date.now();
        await tx
          .table("patients")
          .toCollection()
          .modify((p) => {
            p.phone = toE164(p.phone) ?? p.phone;
            p.nextOfKinPhone = toE164(p.nextOfKinPhone) ?? p.nextOfKinPhone;
            p.updatedAt = now;
          });
        await tx
          .table("immunizations")
          .toCollection()
          .modify((r) => {
            r.facilityId = r.facilityId ?? config.facilityId;
            r.updatedAt = r.updatedAt ?? r.createdAt;
            r.nextVaccineLabel =
              r.nextVaccineLabel ?? nextLabelFor(r.vaccineName, r.doseNumber);
          });
      });
    this.version(4).stores({
      patients:
        "id, &cardNumber, name, phone, nhisNumber, dob, gender, createdAt, guardianId, [name+dob+villageKey]",
      guardians: "id, phone, name, patientId, createdAt",
    });
    this.version(5).stores({
      reminders: "id, patientId, status, sendOn, dueDate",
    });
  }
}

export const db = new PrimaDB();

// Run work that came FROM the server. The flag stops the sync hooks queueing it for upload again.
export function remoteTransaction<T>(
  tables: Table[],
  fn: () => Promise<T>,
): Promise<T> {
  return db.transaction("rw", tables, async () => {
    (Dexie.currentTransaction as unknown as TxFlags).remote = true;
    return fn();
  });
}

function enqueue(
  table: SyncItem["table"],
  recordId: string,
  trans: Transaction,
) {
  if ((trans as unknown as TxFlags).remote) return;
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
db.patients.hook("updating", (_mods, key, _obj, trans) => {
  enqueue("patients", key as string, trans);
});

db.immunizations.hook("creating", (_key, obj, trans) => {
  enqueue("immunizations", obj.id, trans);
});
db.immunizations.hook("updating", (_mods, key, _obj, trans) => {
  enqueue("immunizations", key as string, trans);
});

db.visits.hook("creating", (_key, obj, trans) => {
  enqueue("visits", obj.id, trans);
});
db.visits.hook("updating", (_mods, key, _obj, trans) => {
  enqueue("visits", key as string, trans);
});
db.guardians.hook("creating", (_key, obj, trans) => {
  enqueue("guardians", obj.id, trans);
});
db.guardians.hook("updating", (_mods, key, _obj, trans) => {
  enqueue("guardians", key as string, trans);
});
db.reminders.hook("creating", (_key, obj, trans) => {
  enqueue("reminders", obj.id, trans);
});
db.reminders.hook("updating", (_mods, key, _obj, trans) => {
  enqueue("reminders", key as string, trans);
});
