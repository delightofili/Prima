import { db } from "../db";
import { config } from "./config";
import { pushPending } from "./syncService";
import { VACCINE_BY_KEY, nextFor } from "./vaccines";
import type { ImmunizationRecord, Patient } from "../types";

export async function saveImmunization(
  patient: Patient,
  vaccineKey: string,
  dateGiven: string,
) {
  const vaccine = VACCINE_BY_KEY.get(vaccineKey)!;
  const now = Date.now();
  const record: ImmunizationRecord = {
    id: crypto.randomUUID(),
    patientId: patient.id,
    facilityId: config.facilityId,
    vaccineName: vaccine.vaccineName,
    doseNumber: vaccine.doseNumber,
    dateGiven,
    ...nextFor(vaccine, dateGiven),
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction("rw", db.immunizations, db.syncQueue, async () => {
    await db.immunizations.add(record);
  });
  void pushPending();
}

export async function setImmunizationDeleted(id: string, deleted: boolean) {
  const now = Date.now();
  await db.transaction("rw", db.immunizations, db.syncQueue, async () => {
    await db.immunizations.update(id, {
      deletedAt: deleted ? now : undefined,
      updatedAt: now,
    });
  });
  void pushPending();
}
