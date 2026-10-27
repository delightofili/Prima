import type { Table } from "dexie";
import { db, remoteTransaction } from "../db";
import { supabase } from "./supabase";
import { config } from "./config";
import { generateCardNumber } from "./utils";
import { isPowerSaving, onPowerSavingEnd } from "./power";
import { classify, messageOf, tagFor } from "./syncErrors";
import {
  LIMIT_TAG,
  SCHEMA_TAG,
  beginWork,
  endWork,
  markNetworkFail,
  markOk,
  markStalled,
  recordProblem,
  resetWork,
  setNextRetry,
  setSchemaProblem,
} from "./syncHealth";
import type {
  AuditEntry,
  Guardian,
  ImmunizationRecord,
  Patient,
  Reminder,
  SyncItem,
  Visit,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type QueueTable = SyncItem["table"];

const iso = (ms: number) => new Date(ms).toISOString();
const isoOrNull = (ms?: number) => (ms ? iso(ms) : null);
const toMs = (s?: string | null) => (s ? Date.parse(s) : undefined);

/* ---------- local -> server ---------- */

export const patientRow = (p: Patient) => ({
  id: p.id,
  facility_id: p.facilityId,
  card_number: p.cardNumber,
  full_name: p.fullName,
  name_key: p.name,
  dob: p.dob,
  dob_estimated: p.dobEstimated ?? false,
  gender: p.gender,
  phone: p.phone ?? null,
  village: p.village,
  village_key: p.villageKey,
  lga: p.lga,
  state: p.state,
  next_of_kin_name: p.nextOfKinName,
  next_of_kin_phone: p.nextOfKinPhone,
  nhis_number: p.nhisNumber ?? null,
  blood_group: p.bloodGroup ?? null,
  allergies: p.allergies ?? null,
  para: p.para ?? null,
  gravida: p.gravida ?? null,
  is_pregnant: p.isPregnant,
  initial_chief_complaint: p.initialChiefComplaint ?? null,
  sms_consent: p.smsConsent ?? false,
  sms_consent_at: isoOrNull(p.smsConsentAt),
  notice_given_at: isoOrNull(p.noticeAt),
  notice_version: p.noticeVersion ?? null,
  erased_at: isoOrNull(p.erasedAt),
  created_at: iso(p.createdAt),
  updated_at: iso(p.updatedAt),
  deleted_at: isoOrNull(p.deletedAt),
  merged_into_id: p.mergedIntoId ?? null,
  guardian_id: p.guardianId ?? null,
});

export const immunizationRow = (r: ImmunizationRecord) => ({
  id: r.id,
  patient_id: r.patientId,
  facility_id: r.facilityId,
  vaccine_name: r.vaccineName,
  dose_number: r.doseNumber,
  date_given: r.dateGiven,
  next_due_date: r.nextDueDate ?? null,
  next_vaccine_label: r.nextVaccineLabel ?? null,
  created_at: iso(r.createdAt),
  updated_at: iso(r.updatedAt),
  deleted_at: isoOrNull(r.deletedAt),
});

export const visitRow = (v: Visit) => ({
  id: v.id,
  facility_id: v.facilityId,
  patient_id: v.patientId,
  visit_date: v.visitDate,
  complaints: v.complaints,
  systolic: v.systolic ?? null,
  diastolic: v.diastolic ?? null,
  temperature: v.temperature ?? null,
  weight_kg: v.weightKg ?? null,
  diagnosis_code: v.diagnosisCode ?? null,
  diagnosis_label: v.diagnosisLabel ?? null,
  treatment: v.treatment ?? null,
  next_due_date: v.nextDueDate ?? null,
  erased_at: isoOrNull(v.erasedAt),
  created_at: iso(v.createdAt),
  updated_at: iso(v.updatedAt),
  deleted_at: isoOrNull(v.deletedAt),
});

export const guardianRow = (g: Guardian) => ({
  id: g.id,
  facility_id: g.facilityId,
  full_name: g.fullName,
  name_key: g.name,
  phone: g.phone ?? null,
  relationship: g.relationship,
  patient_id: g.patientId ?? null,
  sms_consent: g.smsConsent ?? false,
  sms_consent_at: isoOrNull(g.smsConsentAt),
  created_at: iso(g.createdAt),
  updated_at: iso(g.updatedAt),
  deleted_at: isoOrNull(g.deletedAt),
});

export const reminderRow = (r: Reminder) => ({
  id: r.id,
  facility_id: r.facilityId,
  patient_id: r.patientId,
  kind: r.kind,
  source_id: r.sourceId,
  title: r.title,
  due_date: r.dueDate,
  send_on: r.sendOn,
  phone: r.phone,
  recipient: r.recipient,
  message: r.message,
  status: r.status,
  sent_at: isoOrNull(r.sentAt),
  created_at: iso(r.createdAt),
  updated_at: iso(r.updatedAt),
});

export const auditRow = (a: AuditEntry) => ({
  id: a.id,
  facility_id: a.facilityId,
  actor_id: a.actorId,
  actor_name: a.actorName,
  action: a.action,
  entity_type: a.entityType ?? null,
  entity_id: a.entityId ?? null,
  summary: a.summary,
  created_at: iso(a.createdAt),
});

/* ---------- server -> local ---------- */

export const patientFromRow = (r: Row): Patient => ({
  id: r.id,
  facilityId: r.facility_id,
  cardNumber: r.card_number,
  fullName: r.full_name,
  name: r.name_key,
  dob: r.dob,
  dobEstimated: r.dob_estimated ? true : undefined,
  gender: r.gender,
  phone: r.phone ?? undefined,
  village: r.village,
  villageKey: r.village_key,
  lga: r.lga,
  state: r.state,
  nextOfKinName: r.next_of_kin_name,
  nextOfKinPhone: r.next_of_kin_phone,
  nhisNumber: r.nhis_number ?? undefined,
  bloodGroup: r.blood_group ?? undefined,
  allergies: r.allergies ?? undefined,
  para: r.para ?? undefined,
  gravida: r.gravida ?? undefined,
  isPregnant: r.is_pregnant,
  initialChiefComplaint: r.initial_chief_complaint ?? undefined,
  smsConsent: r.sms_consent || undefined,
  smsConsentAt: toMs(r.sms_consent_at),
  noticeAt: toMs(r.notice_given_at),
  noticeVersion: r.notice_version ?? undefined,
  erasedAt: toMs(r.erased_at),
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: toMs(r.deleted_at),
  mergedIntoId: r.merged_into_id ?? undefined,
  guardianId: r.guardian_id ?? undefined,
});

export const immunizationFromRow = (r: Row): ImmunizationRecord => ({
  id: r.id,
  patientId: r.patient_id,
  facilityId: r.facility_id,
  vaccineName: r.vaccine_name,
  doseNumber: r.dose_number,
  dateGiven: r.date_given,
  nextDueDate: r.next_due_date ?? undefined,
  nextVaccineLabel: r.next_vaccine_label ?? undefined,
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: toMs(r.deleted_at),
});

export const visitFromRow = (r: Row): Visit => ({
  id: r.id,
  patientId: r.patient_id,
  facilityId: r.facility_id,
  visitDate: r.visit_date,
  complaints: r.complaints,
  systolic: r.systolic ?? undefined,
  diastolic: r.diastolic ?? undefined,
  temperature: r.temperature ?? undefined,
  weightKg: r.weight_kg ?? undefined,
  diagnosisCode: r.diagnosis_code ?? undefined,
  diagnosisLabel: r.diagnosis_label ?? undefined,
  treatment: r.treatment ?? undefined,
  nextDueDate: r.next_due_date ?? undefined,
  erasedAt: toMs(r.erased_at),
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: toMs(r.deleted_at),
});

export const guardianFromRow = (r: Row): Guardian => ({
  id: r.id,
  facilityId: r.facility_id,
  fullName: r.full_name,
  name: r.name_key,
  phone: r.phone ?? undefined,
  relationship: r.relationship,
  patientId: r.patient_id ?? undefined,
  smsConsent: r.sms_consent || undefined,
  smsConsentAt: toMs(r.sms_consent_at),
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: toMs(r.deleted_at),
});

export const reminderFromRow = (r: Row): Reminder => ({
  id: r.id,
  facilityId: r.facility_id,
  patientId: r.patient_id,
  kind: r.kind,
  sourceId: r.source_id,
  title: r.title,
  dueDate: r.due_date,
  sendOn: r.send_on,
  phone: r.phone,
  recipient: r.recipient,
  message: r.message,
  status: r.status,
  sentAt: toMs(r.sent_at),
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
});

/* ---------- settings ---------- */

const BATCH = 100; // records per upload request
const PAGE = 200; // records per download request: small pages still make progress on a weak connection
const MAX_ATTEMPTS = 5; // tries for one record before it is marked "needs attention"
const PULSE_KEY = "pulse";
let runLimitMs = 90_000; // an upload or download run that takes longer than this is given up on

// Only for the automated tests
export const setRunLimitForTests = (ms: number) => {
  runLimitMs = ms;
};

const backoffMs = (attempts: number) =>
  Math.min(300_000, 15_000 * 2 ** (attempts - 1)); // 15s, 30s, 1m, 2m, 4m
const retryAt = new Map<number, number>(); // when a record that failed may be tried again (kept in memory only)

let manualSync = false; // a person tapped "Sync now": that overrides Low Battery Mode once
const paused = () => isPowerSaving() && !manualSync;

async function hasCloudSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

/* ---------- push ---------- */

let running = false;
let runId = 0;
let pushedThisRun = new Set<string>();

const present = <T>(rows: (T | undefined)[]) =>
  rows.filter((r): r is T => r !== undefined);
const idsOf = (batch: SyncItem[]) => batch.map((i) => i.recordId);

async function upsertRows(table: string, rows: object[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
const upsertRow = (table: string, row: object) => upsertRows(table, [row]);

// Sends a patient (and the guardian they point at) once per run. A reminder needs its patient in the cloud.
async function ensurePatient(patientId: string) {
  if (pushedThisRun.has(patientId)) return;
  const p = await db.patients.get(patientId);
  if (!p) return;
  if (p.guardianId) {
    const g = await db.guardians.get(p.guardianId);
    if (g) await upsertRow("guardians", guardianRow(g));
  }
  await upsertRow("patients", patientRow(p));
  pushedThisRun.add(patientId);
}

// One record at a time. Used when a batch is refused, to find out which record is the problem.
async function pushOne(item: SyncItem) {
  if (item.table === "patients") {
    await ensurePatient(item.recordId);
  } else if (item.table === "guardians") {
    const g = await db.guardians.get(item.recordId);
    if (g) await upsertRow("guardians", guardianRow(g));
  } else if (item.table === "reminders") {
    const r = await db.reminders.get(item.recordId);
    if (!r) return;
    await ensurePatient(r.patientId);
    await upsertRow("reminders", reminderRow(r));
  } else if (item.table === "audit") {
    const a = await db.audit.get(item.recordId);
    if (!a) return;
    const { error } = await supabase
      .from("audit_log")
      .upsert(auditRow(a), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
    await db.audit.delete(a.id);
  } else if (item.table === "immunizations") {
    const r = await db.immunizations.get(item.recordId);
    if (r) await upsertRow("immunization_records", immunizationRow(r));
  } else {
    const v = await db.visits.get(item.recordId);
    if (v) await upsertRow("visits", visitRow(v));
  }
}

const isCardClash = (e: unknown) => {
  const err = e as { code?: string; message?: string };
  return err?.code === "23505" && !!err.message?.includes("card_number");
};

async function pushItem(item: SyncItem) {
  try {
    await pushOne(item);
  } catch (e) {
    if (!isCardClash(e)) throw e;
    await db.patients.update(item.recordId, {
      cardNumber: generateCardNumber(config.facilityCode),
    });
    await pushOne(item);
  }
}

/* ---------- batches ---------- */

// A visit needs its patient, a patient needs its guardian: send parents first.
const WAVES: QueueTable[][] = [
  ["guardians"],
  ["patients"],
  ["visits", "immunizations", "reminders"],
  ["audit"],
];

async function sendGuardians(batch: SyncItem[]) {
  await upsertRows(
    "guardians",
    present(await db.guardians.bulkGet(idsOf(batch))).map(guardianRow),
  );
}

async function sendPatients(batch: SyncItem[]) {
  const patients = present(await db.patients.bulkGet(idsOf(batch)));
  const guardianIds = [
    ...new Set(
      patients.map((p) => p.guardianId).filter((g): g is string => !!g),
    ),
  ];
  if (guardianIds.length > 0) {
    await upsertRows(
      "guardians",
      present(await db.guardians.bulkGet(guardianIds)).map(guardianRow),
    );
  }
  await upsertRows("patients", patients.map(patientRow));
  for (const p of patients) pushedThisRun.add(p.id);
}

async function sendVisits(batch: SyncItem[]) {
  await upsertRows(
    "visits",
    present(await db.visits.bulkGet(idsOf(batch))).map(visitRow),
  );
}

async function sendImmunizations(batch: SyncItem[]) {
  await upsertRows(
    "immunization_records",
    present(await db.immunizations.bulkGet(idsOf(batch))).map(immunizationRow),
  );
}

async function sendReminders(batch: SyncItem[]) {
  const reminders = present(await db.reminders.bulkGet(idsOf(batch)));
  for (const patientId of new Set(reminders.map((r) => r.patientId)))
    await ensurePatient(patientId);
  await upsertRows("reminders", reminders.map(reminderRow));
}

async function sendAudit(batch: SyncItem[]) {
  const entries = present(await db.audit.bulkGet(idsOf(batch)));
  if (entries.length > 0) {
    const { error } = await supabase
      .from("audit_log")
      .upsert(entries.map(auditRow), {
        onConflict: "id",
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }
  await db.audit.bulkDelete(entries.map((e) => e.id)); // safely on the server, so the phone keeps no copy
}

const SENDERS: Record<QueueTable, (batch: SyncItem[]) => Promise<void>> = {
  guardians: sendGuardians,
  patients: sendPatients,
  visits: sendVisits,
  immunizations: sendImmunizations,
  reminders: sendReminders,
  audit: sendAudit,
};

async function patientIdOf(item: SyncItem): Promise<string | undefined> {
  if (item.table === "patients") return item.recordId;
  if (item.table === "visits")
    return (await db.visits.get(item.recordId))?.patientId;
  if (item.table === "immunizations")
    return (await db.immunizations.get(item.recordId))?.patientId;
  if (item.table === "reminders")
    return (await db.reminders.get(item.recordId))?.patientId;
  return undefined; // guardians and audit lines do not depend on a patient
}

const note = (item: SyncItem, text: string) =>
  db.syncQueue.update(item.id!, { lastError: text });

async function markFailed(item: SyncItem, text: string) {
  retryAt.delete(item.id!);
  await db.syncQueue.update(item.id!, {
    status: "failed",
    attempts: MAX_ATTEMPTS,
    lastError: text,
  });
}

type Outcome = "ok" | "stop";

// A whole batch was refused, or one record was. Decides what that means.
// Returns "stop" when the connection or the sign-in is the problem, so nothing more can be sent right now.
async function handleFailure(
  e: unknown,
  item: SyncItem,
  table: QueueTable,
  held: Set<string>,
): Promise<Outcome> {
  const kind = classify(e);
  const raw = messageOf(e);

  if (kind === "network") {
    markNetworkFail();
    await note(item, raw);
    return "stop";
  }
  if (kind === "auth") {
    await note(item, "Sign in again to sync");
    return "stop";
  }

  if (item.table === "patients") held.add(item.recordId); // its visits and reminders wait for it, without being tried and failed

  if (kind === "limit") {
    await markFailed(item, `${LIMIT_TAG}: ${raw}`); // parked: not a fault in the record, and not worth retrying until the plan changes
    return "ok";
  }
  if (kind === "schema") {
    setSchemaProblem(`${table}: ${raw}`);
    await markFailed(item, `${SCHEMA_TAG}: ${raw}`); // the same refusal would come again, so fail fast and say so
    return "ok";
  }

  // The record itself is the problem (a bad value, a missing parent, a mistake in Prima). Try again later,
  // with growing gaps, and meanwhile let everything else through.
  recordProblem({ kind, where: table, message: raw, at: Date.now() });
  const attempts = item.attempts + 1;
  const failed = attempts >= MAX_ATTEMPTS;
  await db.syncQueue.update(item.id!, {
    attempts,
    status: failed ? "failed" : "pending",
    lastError: tagFor(kind, raw),
  });
  if (failed) retryAt.delete(item.id!);
  else retryAt.set(item.id!, Date.now() + backoffMs(attempts));
  return "ok";
}

async function sendTable(
  table: QueueTable,
  items: SyncItem[],
  held: Set<string>,
  isCurrent: () => boolean,
): Promise<Outcome> {
  for (let i = 0; i < items.length; i += BATCH) {
    if (!isCurrent()) return "stop";
    const chunk = items.slice(i, i + BATCH);

    try {
      await SENDERS[table](chunk);
      await db.syncQueue.bulkDelete(chunk.map((c) => c.id!));
      chunk.forEach((c) => retryAt.delete(c.id!));
      markOk();
      continue;
    } catch (e) {
      const kind = classify(e);
      if (kind === "network" || kind === "auth")
        return handleFailure(e, chunk[0], table, held);
      if (kind === "schema") {
        // The cloud database lacks something for this whole table. Say so once, and fail the rest quickly.
        setSchemaProblem(`${table}: ${messageOf(e)}`);
        for (const item of items.slice(i)) {
          await markFailed(item, `${SCHEMA_TAG}: ${messageOf(e)}`);
          if (item.table === "patients") held.add(item.recordId);
        }
        return "ok";
      }
    }

    // The batch was refused for a reason about a record. Send one at a time to find which.
    for (const item of chunk) {
      if (!isCurrent()) return "stop";
      try {
        await pushItem(item);
        await db.syncQueue.delete(item.id!);
        retryAt.delete(item.id!);
        markOk();
      } catch (e) {
        if ((await handleFailure(e, item, table, held)) === "stop")
          return "stop";
      }
    }
  }
  return "ok";
}

async function runWaves(isCurrent: () => boolean) {
  const all = await db.syncQueue.orderBy("id").toArray();
  const now = Date.now();

  // Several edits to one record become one upload: it always sends the latest state
  const seen = new Set<string>();
  const live: SyncItem[] = [];
  for (const item of all) {
    if (item.status === "failed") continue;
    const key = `${item.table}:${item.recordId}`;
    if (seen.has(key)) {
      await db.syncQueue.delete(item.id!);
      retryAt.delete(item.id!);
      continue;
    }
    seen.add(key);
    live.push(item);
  }

  // Patients that could not be uploaded (plan limit, a failure): their visits and reminders wait quietly
  const held = new Set<string>();
  for (const item of all)
    if (item.status === "failed" && item.table === "patients")
      held.add(item.recordId);

  // What is not due yet is skipped, and the soonest retry is shown on screen.
  // A patient that is waiting out a delay also holds back its visits, so they do not use up their tries meanwhile.
  const waiting = live.filter((i) => (retryAt.get(i.id!) ?? 0) > now);
  setNextRetry(
    waiting.length > 0
      ? Math.min(...waiting.map((i) => retryAt.get(i.id!)!))
      : null,
  );
  for (const item of waiting)
    if (item.table === "patients") held.add(item.recordId);

  for (const tables of WAVES) {
    for (const table of tables) {
      if (!isCurrent()) return;
      let mine = live.filter(
        (i) => i.table === table && (retryAt.get(i.id!) ?? 0) <= now,
      );
      if (held.size > 0) {
        const keep: SyncItem[] = [];
        for (const item of mine) {
          const pid = await patientIdOf(item);
          if (!pid || !held.has(pid)) keep.push(item);
        }
        mine = keep;
      }
      if (mine.length === 0) continue;
      if ((await sendTable(table, mine, held, isCurrent)) === "stop") return;
    }
  }
}

export async function pushPending() {
  if (running || !navigator.onLine || paused()) return;
  if (!(await hasCloudSession())) return; // signed out of the cloud: wait quietly, records stay safe
  const id = ++runId;
  running = true;
  pushedThisRun = new Set();
  beginWork();
  // If a request never answers, give up on this run so the next one can start. Without this, one hung request
  // would stop all uploading until the app is reloaded.
  const watchdog = setTimeout(() => {
    if (runId !== id || !running) return;
    running = false;
    resetWork();
    markStalled();
  }, runLimitMs);
  try {
    await runWaves(() => runId === id);
  } catch (e) {
    console.warn("Upload run stopped", e);
    recordProblem({
      kind: "bug",
      where: "upload",
      message: messageOf(e),
      at: Date.now(),
    });
  } finally {
    clearTimeout(watchdog);
    if (runId === id) {
      running = false;
      endWork();
    }
  }
}

/* ---------- pull ---------- */

let pulling = false;
let pullId = 0;

async function applyRemote<T extends { id: string; updatedAt: number }>(
  table: Table<T, string>,
  incoming: T[],
) {
  await remoteTransaction([table, db.syncQueue], async () => {
    for (const remote of incoming) {
      try {
        const local = await table.get(remote.id);
        if (!local) {
          await table.add(remote);
        } else if (
          (remote as { erasedAt?: number }).erasedAt ||
          remote.updatedAt > local.updatedAt
        ) {
          await table.put(remote);
          // The server copy wins, so our stale queued upload is dropped.
          await db.syncQueue.where("recordId").equals(remote.id).delete();
        }
      } catch (e) {
        console.warn("Skipped a record from the server", remote.id, e);
      }
    }
  });
}

type Remote =
  | "patients"
  | "visits"
  | "immunization_records"
  | "guardians"
  | "reminders";

async function pullOne<T extends { id: string; updatedAt: number }>(
  remote: Remote,
  table: Table<T, string>,
  fromRow: (r: Row) => T,
) {
  const cursorKey = `cursor:${remote}`;
  let cursor =
    (await db.meta.get(cursorKey))?.value ?? "1970-01-01T00:00:00.000Z";

  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from(remote)
      .select("*")
      .eq("facility_id", config.facilityId)
      .gte("synced_at", cursor)
      .order("synced_at", { ascending: true })
      .limit(PAGE);
    if (error) throw error;

    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;

    await applyRemote(table, rows.map(fromRow));

    const newest = rows[rows.length - 1].synced_at as string;
    const advanced = newest > cursor;
    cursor = newest;
    await db.meta.put({ key: cursorKey, value: cursor });
    if (rows.length < PAGE || !advanced) break;
  }
}

// One cheap call: "what is the newest change in my facility?"
async function remotePulse(): Promise<string | null> {
  const { data, error } = await supabase.rpc("facility_pulse");
  if (error) {
    if ((error as { code?: string }).code === "PGRST202") return null; // function not installed yet: always pull
    throw error;
  }
  return (data as string | null) ?? null;
}

export async function pullChanges(force = false) {
  if (pulling || !navigator.onLine || paused()) return;
  if (!(await hasCloudSession())) return;
  const id = ++pullId;
  pulling = true;
  beginWork();
  const watchdog = setTimeout(() => {
    if (pullId !== id || !pulling) return;
    pulling = false;
    resetWork();
    markStalled();
  }, runLimitMs);

  try {
    let pulse: string | null = null;
    try {
      pulse = await remotePulse();
    } catch (e) {
      if (classify(e) === "network") throw e; // no connection: stop here
      recordProblem({
        kind: "pull",
        where: "facility_pulse",
        message: messageOf(e),
        at: Date.now(),
      }); // otherwise just pull everything
    }
    const known = (await db.meta.get(PULSE_KEY))?.value ?? null;
    if (!force && pulse && pulse === known) {
      markOk();
      return; // nothing new anywhere in this facility
    }

    const steps: [Remote, () => Promise<void>][] = [
      ["guardians", () => pullOne("guardians", db.guardians, guardianFromRow)],
      ["patients", () => pullOne("patients", db.patients, patientFromRow)],
      ["visits", () => pullOne("visits", db.visits, visitFromRow)],
      [
        "immunization_records",
        () =>
          pullOne(
            "immunization_records",
            db.immunizations,
            immunizationFromRow,
          ),
      ],
      ["reminders", () => pullOne("reminders", db.reminders, reminderFromRow)],
    ];

    let complete = true;
    for (const [name, step] of steps) {
      if (pullId !== id) return;
      try {
        await step();
      } catch (e) {
        const kind = classify(e);
        complete = false;
        if (kind === "network") {
          markNetworkFail();
          break;
        }
        if (kind === "auth") break;
        if (kind === "schema") setSchemaProblem(`${name}: ${messageOf(e)}`);
        recordProblem({
          kind: "pull",
          where: name,
          message: messageOf(e),
          at: Date.now(),
        });
        // carry on with the other tables: one broken table must not stop the rest
      }
    }

    if (complete) {
      if (pulse) await db.meta.put({ key: PULSE_KEY, value: pulse });
      markOk();
    }
  } catch (e) {
    if (classify(e) === "network") markNetworkFail();
    console.warn("Pull failed, will retry", e);
  } finally {
    clearTimeout(watchdog);
    if (pullId === id) {
      pulling = false;
      endWork();
    }
  }
}

/* ---------- public ---------- */

export async function syncNow(manual = false) {
  if (manual) manualSync = true;
  try {
    await pushPending();
    await pullChanges();
  } finally {
    if (manual) manualSync = false;
  }
}

// Failed records get another go: after the SQL was run, the plan changed, or the person tapped Retry
export async function retryFailed() {
  retryAt.clear();
  setSchemaProblem(null);
  await db.syncQueue.toCollection().modify((item) => {
    if (item.status === "failed") {
      item.status = "pending";
      item.attempts = 0;
    }
  });
  await syncNow(true);
}

/* ---------- when to sync ---------- */

const PULL_EVERY = 180_000; // 3 minutes, only while the app is visible
const MIN_PULL_GAP = 45_000;
const BACKOFF_START = 15_000;
const BACKOFF_MAX = 300_000;

const jitter = (ms: number) => ms * (0.8 + Math.random() * 0.4); // phones must not all call at the same second
const waitingCount = () =>
  db.syncQueue.filter((i) => i.status !== "failed").count();

let lastPullTry = 0;
let backoff = BACKOFF_START;

async function pullIfDue() {
  if (document.visibilityState !== "visible") return;
  if (Date.now() - lastPullTry < MIN_PULL_GAP) return;
  lastPullTry = Date.now();
  await pullChanges();
}

// Retries uploads only while something is waiting, and slows down while the server keeps failing
async function retryLoop() {
  try {
    if (navigator.onLine && (await waitingCount()) > 0) {
      await pushPending();
      backoff =
        (await waitingCount()) > 0
          ? Math.min(backoff * 2, BACKOFF_MAX)
          : BACKOFF_START;
    } else {
      backoff = BACKOFF_START;
    }
  } catch (e) {
    console.warn("Retry loop", e); // never let the loop die: it is what keeps syncing alive
  } finally {
    setTimeout(() => void retryLoop(), jitter(backoff));
  }
}

function pullLoop() {
  setTimeout(async () => {
    try {
      await pullIfDue();
    } finally {
      pullLoop();
    }
  }, jitter(PULL_EVERY));
}

let started = false;

export function startSync() {
  if (started) return;
  started = true;
  window.addEventListener("online", () => {
    backoff = BACKOFF_START;
    lastPullTry = Date.now();
    void syncNow();
  });
  document.addEventListener("visibilitychange", () => void pullIfDue());
  onPowerSavingEnd(() => void syncNow()); // battery recovered or charging started: catch up
  lastPullTry = Date.now();
  void syncNow();
  pullLoop();
  setTimeout(() => void retryLoop(), jitter(backoff));
}
