import type { Table } from "dexie";
import { db, remoteTransaction } from "../db";
import { supabase } from "./supabase";
import { config } from "./config";
import { generateCardNumber } from "./utils";
import type { ImmunizationRecord, Patient, SyncItem, Visit } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const iso = (ms: number) => new Date(ms).toISOString();
const isoOrNull = (ms?: number) => (ms ? iso(ms) : null);
const toMs = (s?: string | null) => (s ? Date.parse(s) : undefined);

/* ---------- local -> server ---------- */

const patientRow = (p: Patient) => ({
  id: p.id,
  facility_id: p.facilityId,
  card_number: p.cardNumber,
  full_name: p.fullName,
  name_key: p.name,
  dob: p.dob,
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
  created_at: iso(p.createdAt),
  updated_at: iso(p.updatedAt),
  deleted_at: isoOrNull(p.deletedAt),
});

const immunizationRow = (r: ImmunizationRecord) => ({
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

const visitRow = (v: Visit) => ({
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
  created_at: iso(v.createdAt),
  updated_at: iso(v.updatedAt),
  deleted_at: isoOrNull(v.deletedAt),
});

/* ---------- server -> local ---------- */

const patientFromRow = (r: Row): Patient => ({
  id: r.id,
  facilityId: r.facility_id,
  cardNumber: r.card_number,
  fullName: r.full_name,
  name: r.name_key,
  dob: r.dob,
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
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: toMs(r.deleted_at),
});

const immunizationFromRow = (r: Row): ImmunizationRecord => ({
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

const visitFromRow = (r: Row): Visit => ({
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
  createdAt: Date.parse(r.created_at),
  updatedAt: Date.parse(r.updated_at),
  deletedAt: toMs(r.deleted_at),
});

/* ---------- push ---------- */

async function pushOne(item: SyncItem) {
  if (item.table === "patients") {
    const p = await db.patients.get(item.recordId);
    if (!p) return;
    const { error } = await supabase
      .from("patients")
      .upsert(patientRow(p), { onConflict: "id" });
    if (error) throw error;
  } else if (item.table === "immunizations") {
    const r = await db.immunizations.get(item.recordId);
    if (!r) return;
    const { error } = await supabase
      .from("immunization_records")
      .upsert(immunizationRow(r), { onConflict: "id" });
    if (error) throw error;
  } else {
    const v = await db.visits.get(item.recordId);
    if (!v) return;
    const { error } = await supabase
      .from("visits")
      .upsert(visitRow(v), { onConflict: "id" });
    if (error) throw error;
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

let running = false;

export async function pushPending() {
  if (running || !navigator.onLine) return;
  running = true;
  try {
    const items = await db.syncQueue.orderBy("id").toArray();
    const seen = new Set<string>();

    for (const item of items) {
      if (item.status === "failed") continue;

      // Several edits to one record: the first push sends its latest state, so drop the repeats.
      const key = `${item.table}:${item.recordId}`;
      if (seen.has(key)) {
        await db.syncQueue.delete(item.id!);
        continue;
      }
      seen.add(key);

      try {
        await pushItem(item);
        await db.syncQueue.delete(item.id!);
      } catch (e) {
        const err = e as { code?: string; message?: string };
        const message = err?.message ?? String(e);
        const network =
          !err?.code || /failed to fetch|network|load failed/i.test(message);

        if (network) {
          await db.syncQueue.update(item.id!, { lastError: message });
          break;
        }
        const attempts = item.attempts + 1;
        await db.syncQueue.update(item.id!, {
          attempts,
          lastError: message,
          status: attempts >= 5 ? "failed" : "pending",
        });
        if (attempts < 5) break;
      }
    }
  } finally {
    running = false;
  }
}

/* ---------- pull ---------- */

const PAGE = 500;
let pulling = false;

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
        } else if (remote.updatedAt > local.updatedAt) {
          await table.put(remote);
          // The newer server copy replaces our older one, so our stale queued upload is dropped.
          await db.syncQueue.where("recordId").equals(remote.id).delete();
        }
      } catch (e) {
        console.warn("Skipped a record from the server", remote.id, e);
      }
    }
  });
}

async function pullOne<T extends { id: string; updatedAt: number }>(
  remote: "patients" | "visits" | "immunization_records",
  table: Table<T, string>,
  fromRow: (r: Row) => T,
) {
  const cursorKey = `cursor:${remote}`;
  let cursor =
    (await db.meta.get(cursorKey))?.value ?? "1970-01-01T00:00:00.000Z";

  for (let page = 0; page < 20; page++) {
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

export async function pullChanges() {
  if (pulling || !navigator.onLine) return;
  pulling = true;
  try {
    await pullOne("patients", db.patients, patientFromRow);
    await pullOne("visits", db.visits, visitFromRow);
    await pullOne(
      "immunization_records",
      db.immunizations,
      immunizationFromRow,
    );
  } catch (e) {
    console.warn("Pull failed, will retry", e);
  } finally {
    pulling = false;
  }
}

/* ---------- public ---------- */

export async function syncNow() {
  await pushPending();
  await pullChanges();
}

export async function retryFailed() {
  await db.syncQueue.toCollection().modify((item) => {
    if (item.status === "failed") {
      item.status = "pending";
      item.attempts = 0;
    }
  });
  await syncNow();
}

export function startSync() {
  window.addEventListener("online", () => void syncNow());
  setInterval(() => void syncNow(), 30000);
  void syncNow();
}
