import { db } from "../db";
import { config } from "./config";
import { pushPending } from "./syncService";
import type { VisitFormValues } from "./visitSchema";
import type { Patient, Visit } from "../types";

export interface Diagnosis {
  code?: string;
  label: string;
}

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
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction("rw", db.visits, db.syncQueue, async () => {
    await db.visits.add(visit);
  });
  void pushPending();
  return visit;
}
