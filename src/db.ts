import Dexie, { type Table, type Transaction } from "dexie";
import { getCurrentFacility } from "./lib/config";
import { toE164 } from "./lib/utils";
import { nextLabelFor } from "./lib/vaccines";
import { buildAudit } from "./lib/auditCore";
import type {
  ImmunizationRecord,
  MetaItem,
  Patient,
  SyncItem,
  User,
  Visit,
  Guardian,
  Reminder,
  AuditEntry,
} from "./types";

interface TxFlags {
  remote?: boolean; // data pulled from the server: do not queue it, do not audit it
  quiet?: boolean; // a bulk restore: queue it for upload, but write one audit line instead of thousands
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
  audit!: Table<AuditEntry, string>;

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
            r.facilityId = r.facilityId ?? getCurrentFacility()?.id ?? "";
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
    this.version(6).stores({
      audit: "id, createdAt",
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

export function quietTransaction<T>(
  tables: Table[],
  fn: () => Promise<T>,
): Promise<T> {
  return db.transaction("rw", tables, async () => {
    (Dexie.currentTransaction as unknown as TxFlags).quiet = true;
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

export async function writeAudit(entry: AuditEntry) {
  await db.transaction("rw", db.audit, db.syncQueue, async () => {
    await db.audit.add(entry);
  });
}

// Writes the audit line only AFTER the change has really been saved.
function track(
  trans: Transaction,
  action: string,
  entityType: string,
  entityId: string,
  summary: string,
) {
  const flags = trans as unknown as TxFlags;
  if (flags.remote || flags.quiet) return;
  const entry = buildAudit(action, entityType, entityId, summary);
  if (!entry) return;
  trans.on("complete", () => {
    void writeAudit(entry);
  });
}

const has = (mods: object, key: string) =>
  Object.prototype.hasOwnProperty.call(mods, key);
const val = (mods: object, key: string) =>
  (mods as Record<string, unknown>)[key];
const fieldsOf = (mods: object) =>
  Object.keys(mods).filter((k) => k !== "updatedAt");

/* ---------- patients ---------- */
db.patients.hook("creating", (_key, obj, trans) => {
  enqueue("patients", obj.id, trans);
  track(trans, "patient.create", "patient", obj.id, `card ${obj.cardNumber}`);
});
db.patients.hook("updating", (mods, key, obj, trans) => {
  const id = key as string;
  const card = `card ${obj.cardNumber}`;
  enqueue("patients", id, trans);

  if (has(mods, "deletedAt")) {
    const merged = has(mods, "mergedIntoId") && !!val(mods, "mergedIntoId");
    const action = val(mods, "deletedAt")
      ? merged
        ? "patient.merge"
        : "patient.delete"
      : "patient.restore";
    track(trans, action, "patient", id, card);
  } else if (has(mods, "smsConsent")) {
    track(
      trans,
      val(mods, "smsConsent") ? "consent.sms.on" : "consent.sms.off",
      "patient",
      id,
      card,
    );
  } else if (has(mods, "noticeAt")) {
    track(trans, "consent.notice", "patient", id, card);
  } else if (fieldsOf(mods).length > 0) {
    track(
      trans,
      "patient.update",
      "patient",
      id,
      `${card}: ${fieldsOf(mods).join(", ")}`,
    );
  }
});

/* ---------- visits (logged against the patient) ---------- */
db.visits.hook("creating", (_key, obj, trans) => {
  enqueue("visits", obj.id, trans);
  track(
    trans,
    "visit.create",
    "patient",
    obj.patientId,
    `visit on ${obj.visitDate}`,
  );
});
db.visits.hook("updating", (mods, key, obj, trans) => {
  enqueue("visits", key as string, trans);
  const what = `visit on ${obj.visitDate}`;
  if (has(mods, "deletedAt")) {
    track(
      trans,
      val(mods, "deletedAt") ? "visit.delete" : "visit.restore",
      "patient",
      obj.patientId,
      what,
    );
  } else if (has(mods, "patientId")) {
    track(
      trans,
      "visit.move",
      "patient",
      obj.patientId,
      `${what}, moved by a merge`,
    );
  } else {
    track(trans, "visit.update", "patient", obj.patientId, what);
  }
});

/* ---------- vaccines ---------- */
db.immunizations.hook("creating", (_key, obj, trans) => {
  enqueue("immunizations", obj.id, trans);
  track(
    trans,
    "vaccine.add",
    "patient",
    obj.patientId,
    `${obj.vaccineName} dose ${obj.doseNumber}`,
  );
});
db.immunizations.hook("updating", (mods, key, obj, trans) => {
  enqueue("immunizations", key as string, trans);
  const what = `${obj.vaccineName} dose ${obj.doseNumber}`;
  if (has(mods, "deletedAt")) {
    track(
      trans,
      val(mods, "deletedAt") ? "vaccine.delete" : "vaccine.restore",
      "patient",
      obj.patientId,
      what,
    );
  } else if (has(mods, "patientId")) {
    track(
      trans,
      "vaccine.move",
      "patient",
      obj.patientId,
      `${what}, moved by a merge`,
    );
  }
});

/* ---------- guardians ---------- */
db.guardians.hook("creating", (_key, obj, trans) => {
  enqueue("guardians", obj.id, trans);
  track(trans, "guardian.create", "guardian", obj.id, obj.relationship);
});
db.guardians.hook("updating", (mods, key, _obj, trans) => {
  const id = key as string;
  enqueue("guardians", id, trans);
  if (has(mods, "smsConsent")) {
    track(
      trans,
      val(mods, "smsConsent") ? "consent.sms.on" : "consent.sms.off",
      "guardian",
      id,
      "guardian",
    );
  } else if (fieldsOf(mods).length > 0) {
    track(trans, "guardian.update", "guardian", id, fieldsOf(mods).join(", "));
  }
});

/* ---------- reminders (system generated, not audited) and the audit table itself ---------- */
db.reminders.hook("creating", (_key, obj, trans) => {
  enqueue("reminders", obj.id, trans);
});
db.reminders.hook("updating", (_mods, key, _obj, trans) => {
  enqueue("reminders", key as string, trans);
});
db.audit.hook("creating", (_key, obj, trans) => {
  enqueue("audit", obj.id, trans);
});
