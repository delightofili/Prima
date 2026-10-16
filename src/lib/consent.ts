import { db } from "../db";
import { pushPending } from "./syncService";

export async function setPatientSmsConsent(id: string, on: boolean) {
  const now = Date.now();
  await db.transaction("rw", db.patients, db.syncQueue, async () => {
    await db.patients.update(id, {
      smsConsent: on ? true : undefined,
      smsConsentAt: on ? now : undefined,
      updatedAt: now,
    });
  });
  void pushPending();
}

export async function setGuardianSmsConsent(id: string, on: boolean) {
  const now = Date.now();
  await db.transaction("rw", db.guardians, db.syncQueue, async () => {
    await db.guardians.update(id, {
      smsConsent: on ? true : undefined,
      smsConsentAt: on ? now : undefined,
      updatedAt: now,
    });
  });
  void pushPending();
}
