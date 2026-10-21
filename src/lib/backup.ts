import type { Table } from "dexie";
import { db, quietTransaction } from "../db";
import { logAudit } from "./audit";
import { config } from "./config";
import { pushPending } from "./syncService";
import { todayISO } from "./utils";
import type {
  Guardian,
  ImmunizationRecord,
  Patient,
  Reminder,
  Visit,
} from "../types";

export class BackupError extends Error {}

const FORMAT = "prima-backup";
const ITERATIONS = 200_000;
const MAX_ROWS = 200_000;
const LAST_KEY = "lastBackup";

interface Tables {
  guardians: Guardian[];
  patients: Patient[];
  visits: Visit[];
  immunizations: ImmunizationRecord[];
  reminders: Reminder[];
}

export interface BackupData {
  app: "prima";
  schema: 1;
  facilityId: string;
  facilityName: string;
  createdAt: string;
  tables: Tables;
}

export interface RestoreRow {
  label: string;
  add: number;
  update: number;
  keep: number;
}
export interface RestorePreview {
  facilityName: string;
  createdAt: string;
  rows: RestoreRow[];
  erasedSkipped: number;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

// Chunked: spreading a few million bytes into String.fromCharCode crashes the call stack
function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const fromB64 = (b: string) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));

async function keyFor(pass: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(pass),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/* ---------- create ---------- */

export async function createBackup(
  passphrase: string,
): Promise<{ file: File; summary: string }> {
  if (passphrase.length < 8)
    throw new BackupError("Use a password of at least 8 characters.");

  const [guardians, patients, visits, immunizations, reminders] =
    await Promise.all([
      db.guardians.toArray(),
      db.patients.toArray(),
      db.visits.toArray(),
      db.immunizations.toArray(),
      db.reminders.toArray(),
    ]);
  const data: BackupData = {
    app: "prima",
    schema: 1,
    facilityId: config.facilityId,
    facilityName: config.facilityName,
    createdAt: new Date().toISOString(),
    tables: { guardians, patients, visits, immunizations, reminders },
  };

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(passphrase, salt, ITERATIONS);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      enc.encode(JSON.stringify(data)),
    ),
  );

  const envelope = JSON.stringify({
    format: FORMAT,
    v: 1,
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(cipher),
  });
  const file = new File(
    [envelope],
    `prima-backup-${config.facilityCode}-${todayISO()}.primabackup`,
    {
      type: "application/octet-stream",
    },
  );

  const summary = `${patients.length} patients, ${visits.length} visits`;
  await db.meta.put({ key: LAST_KEY, value: String(Date.now()) });
  await logAudit("backup.create", "facility", config.facilityId, summary);
  return { file, summary };
}

/* ---------- open and check ---------- */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function rows<T>(
  raw: unknown,
  label: string,
  test: (r: Record<string, unknown>) => boolean,
): T[] {
  if (!Array.isArray(raw))
    throw new BackupError(`The backup is missing its ${label} list.`);
  if (raw.length > MAX_ROWS)
    throw new BackupError("This backup is larger than Prima accepts.");
  for (const r of raw) {
    const ok =
      isObj(r) &&
      typeof r.id === "string" &&
      typeof r.updatedAt === "number" &&
      r.facilityId === config.facilityId && // every single record must belong to this facility
      test(r);
    if (!ok)
      throw new BackupError(
        `The backup has a damaged ${label} record, so nothing was restored.`,
      );
  }
  return raw as T[];
}

const str = (v: unknown) => typeof v === "string";

export async function openBackup(
  file: File,
  passphrase: string,
): Promise<BackupData> {
  let env: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(await file.text());
    if (!isObj(parsed)) throw new Error("not an object");
    env = parsed;
  } catch {
    throw new BackupError("This is not a Prima backup file.");
  }
  if (
    env.format !== FORMAT ||
    env.v !== 1 ||
    !str(env.salt) ||
    !str(env.iv) ||
    !str(env.data) ||
    typeof env.iterations !== "number" ||
    env.iterations < 100_000 ||
    env.iterations > 2_000_000
  ) {
    throw new BackupError(
      "This is not a Prima backup file, or it is from a newer version.",
    );
  }

  let plain: string;
  try {
    const key = await keyFor(
      passphrase,
      fromB64(env.salt as string),
      env.iterations,
    );
    const buf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(env.iv as string) as BufferSource },
      key,
      fromB64(env.data as string) as BufferSource,
    );
    plain = dec.decode(buf);
  } catch {
    throw new BackupError("Wrong password, or the file is damaged.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(plain);
  } catch {
    throw new BackupError("The backup is damaged.");
  }
  if (
    !isObj(raw) ||
    raw.app !== "prima" ||
    raw.schema !== 1 ||
    !isObj(raw.tables)
  ) {
    throw new BackupError("The backup is damaged or from a newer version.");
  }
  if (raw.facilityId !== config.facilityId) {
    const name = str(raw.facilityName) ? raw.facilityName : "another facility";
    throw new BackupError(
      `This backup belongs to ${name}. It cannot be restored here.`,
    );
  }

  const t = raw.tables;
  return {
    app: "prima",
    schema: 1,
    facilityId: raw.facilityId as string,
    facilityName: str(raw.facilityName) ? (raw.facilityName as string) : "",
    createdAt: str(raw.createdAt) ? (raw.createdAt as string) : "",
    tables: {
      guardians: rows<Guardian>(t.guardians, "guardian", (r) =>
        str(r.fullName),
      ),
      patients: rows<Patient>(
        t.patients,
        "patient",
        (r) => str(r.cardNumber) && str(r.fullName) && str(r.dob),
      ),
      visits: rows<Visit>(
        t.visits,
        "visit",
        (r) => str(r.patientId) && str(r.visitDate),
      ),
      immunizations: rows<ImmunizationRecord>(
        t.immunizations,
        "vaccine",
        (r) => str(r.patientId) && str(r.vaccineName),
      ),
      reminders: rows<Reminder>(
        t.reminders,
        "reminder",
        (r) => str(r.patientId) && str(r.status),
      ),
    },
  };
}

/* ---------- restore: add what is missing, keep what is newer, delete nothing ---------- */

async function run(data: BackupData, write: boolean): Promise<RestorePreview> {
  const erased = new Set(
    (await db.patients.filter((p) => !!p.erasedAt).toArray()).map((p) => p.id),
  );
  const t = data.tables;
  const out: RestoreRow[] = [];

  const step = async <T extends { id: string; updatedAt: number }>(
    label: string,
    table: Table<T, string>,
    incoming: T[],
    skip: (r: T) => boolean,
  ) => {
    const existing = await table.bulkGet(incoming.map((r) => r.id));
    const add: T[] = [];
    const put: T[] = [];
    let keep = 0;
    incoming.forEach((r, i) => {
      if (skip(r)) {
        keep++;
        return;
      }
      const cur = existing[i];
      if (!cur) add.push(r);
      else if (r.updatedAt > cur.updatedAt) put.push(r);
      else keep++;
    });
    if (write) {
      if (add.length > 0) await table.bulkAdd(add);
      if (put.length > 0) await table.bulkPut(put);
    }
    out.push({ label, add: add.length, update: put.length, keep });
  };

  const body = async () => {
    await step("Guardians", db.guardians, t.guardians, () => false);
    await step("Patients", db.patients, t.patients, (p) => erased.has(p.id));
    await step("Visits", db.visits, t.visits, (v) => erased.has(v.patientId));
    await step("Vaccine records", db.immunizations, t.immunizations, (r) =>
      erased.has(r.patientId),
    );
    await step("Reminders", db.reminders, t.reminders, (r) =>
      erased.has(r.patientId),
    );
  };

  if (write) {
    await quietTransaction(
      [
        db.guardians,
        db.patients,
        db.visits,
        db.immunizations,
        db.reminders,
        db.syncQueue,
      ],
      body,
    );
  } else {
    await body();
  }

  return {
    facilityName: data.facilityName,
    createdAt: data.createdAt,
    rows: out,
    erasedSkipped: t.patients.filter((p) => erased.has(p.id)).length,
  };
}

export const previewRestore = (data: BackupData) => run(data, false);

export async function restoreBackup(data: BackupData): Promise<RestorePreview> {
  const result = await run(data, true);
  const added = result.rows.reduce((n, r) => n + r.add, 0);
  const updated = result.rows.reduce((n, r) => n + r.update, 0);
  await logAudit(
    "backup.restore",
    "facility",
    config.facilityId,
    `${added} records added, ${updated} updated`,
  );
  void pushPending();
  return result;
}
