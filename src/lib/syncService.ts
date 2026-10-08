import { db } from "../db";
import { supabase } from "./supabase";
import { config } from "./config";
import { generateCardNumber } from "./utils";
import type { ImmunizationRecord, Patient, SyncItem, Visit } from "../types";

const iso = (ms: number) => new Date(ms).toISOString();

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
});

const immunizationRow = (r: ImmunizationRecord) => ({
  id: r.id,
  patient_id: r.patientId,
  vaccine_name: r.vaccineName,
  dose_number: r.doseNumber,
  date_given: r.dateGiven,
  next_due_date: r.nextDueDate ?? null,
  created_at: iso(r.createdAt),
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
});

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
    for (const item of items) {
      if (item.status === "failed") continue;
      try {
        await pushItem(item);
        await db.syncQueue.delete(item.id!);
      } catch (e) {
        const err = e as { code?: string; message?: string };
        const message = err?.message ?? String(e);
        const network =
          !err?.code || /failed to fetch|network|load failed/i.test(message);

        if (network) {
          // No signal, not a rejection: keep it pending and try again later
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

export async function retryFailed() {
  await db.syncQueue.toCollection().modify((item) => {
    if (item.status === "failed") {
      item.status = "pending";
      item.attempts = 0;
    }
  });
  await pushPending();
}

export function startSync() {
  window.addEventListener("online", () => void pushPending());
  setInterval(() => void pushPending(), 15000);
  void pushPending();
}
