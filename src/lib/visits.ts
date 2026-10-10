import { db } from "../db";
import { config } from "./config";
import { pushPending } from "./syncService";
import type { VisitFormValues } from "./visitSchema";
import type { Patient, Visit } from "../types";

export interface Diagnosis {
  code?: string;
  label: string;
}

const fieldsFrom = (v: VisitFormValues, dx: Diagnosis) => ({
  visitDate: v.visitDate,
  complaints: v.complaints.trim(),
  systolic: v.systolic,
  diastolic: v.diastolic,
  temperature: v.temperature,
  weightKg: v.weightKg,
  diagnosisCode: dx.code,
  diagnosisLabel: dx.label.trim() || undefined,
  treatment: v.treatment?.trim() || undefined,
  nextDueDate: v.nextDueDate || undefined,
});

export async function saveVisit(
  patient: Patient,
  v: VisitFormValues,
  dx: Diagnosis,
): Promise<Visit> {
  const now = Date.now();
  const visit: Visit = {
    id: crypto.randomUUID(),
    patientId: patient.id,
    facilityId: config.facilityId,
    ...fieldsFrom(v, dx),
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction("rw", db.visits, db.syncQueue, async () => {
    await db.visits.add(visit);
  });
  void pushPending();
  return visit;
}

export async function updateVisit(
  existing: Visit,
  v: VisitFormValues,
  dx: Diagnosis,
) {
  await db.transaction("rw", db.visits, db.syncQueue, async () => {
    await db.visits.update(existing.id, {
      ...fieldsFrom(v, dx),
      updatedAt: Date.now(),
    });
  });
  void pushPending();
}

export async function setVisitDeleted(id: string, deleted: boolean) {
  const now = Date.now();
  await db.transaction("rw", db.visits, db.syncQueue, async () => {
    await db.visits.update(id, {
      deletedAt: deleted ? now : undefined,
      updatedAt: now,
    });
  });
  void pushPending();
}
