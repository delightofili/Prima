import Dexie from "dexie";
import { db } from "../db";
import { config } from "./config";
import { generateCardNumber, normalize, toE164, formatPhone } from "./utils";
import { VACCINE_BY_KEY, nextFor } from "./vaccines";
import { pushPending } from "./syncService";
import type { PatientFormValues } from "./schema";
import type { ImmunizationRecord, Patient } from "../types";
import { FREE_PATIENT_LIMIT, PlanLimitError, canUse, getPlan } from "./plan";
import { buildGuardian, type GuardianChoice } from "./guardians";
import { NOTICE_VERSION } from "./privacy";

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : undefined;
};

export async function findExactDuplicate(
  fullName: string,
  dob: string,
  village: string,
  excludeId?: string,
) {
  if (!fullName.trim() || !dob || !village.trim()) return undefined;
  return db.patients
    .where("[name+dob+villageKey]")
    .equals([normalize(fullName), dob, normalize(village)])
    .filter((p) => !p.deletedAt && p.id !== excludeId)
    .first();
}

function fieldsFrom(values: PatientFormValues) {
  return {
    fullName: values.fullName.trim(),
    name: normalize(values.fullName),
    dob: values.dob,
    gender: values.gender,
    phone: toE164(values.phone),
    village: values.village.trim(),
    villageKey: normalize(values.village),
    lga: values.lga.trim(),
    state: values.state.trim(),
    nextOfKinName: values.nextOfKinName.trim(),
    nextOfKinPhone:
      toE164(values.nextOfKinPhone) ?? values.nextOfKinPhone.trim(),
    nhisNumber: clean(values.nhisNumber),
    bloodGroup: values.bloodGroup || undefined,
    allergies: clean(values.allergies),
    para: values.para,
    gravida: values.gravida,
    isPregnant: values.isPregnant,
    initialChiefComplaint: values.isNewAdmission
      ? clean(values.initialChiefComplaint)
      : undefined,
    dobEstimated: values.dobEstimated ? true : undefined,
  };
}

export function valuesFromPatient(p: Patient): Partial<PatientFormValues> {
  return {
    isNewAdmission: !!p.initialChiefComplaint,
    initialChiefComplaint: p.initialChiefComplaint ?? "",
    fullName: p.fullName,
    dob: p.dob,
    gender: p.gender,
    phone: formatPhone(p.phone) ?? "",
    village: p.village,
    lga: p.lga,
    state: p.state,
    nextOfKinName: p.nextOfKinName,
    nextOfKinPhone: formatPhone(p.nextOfKinPhone) ?? p.nextOfKinPhone,
    nhisNumber: p.nhisNumber ?? "",
    bloodGroup: p.bloodGroup ?? "",
    allergies: p.allergies ?? "",
    para: p.para,
    gravida: p.gravida,
    isPregnant: p.isPregnant,
    smsConsent: !!p.smsConsent,
    noticeGiven: !!p.noticeAt,
    dobEstimated: p.dobEstimated ?? false,
  };
}

export async function registerPatient(
  values: PatientFormValues,
  picked: Record<string, string>,
  guardian: GuardianChoice = { kind: "none" },
): Promise<Patient> {
  if (!canUse(getPlan(), "unlimitedPatients")) {
    const active = await db.patients.filter((p) => !p.deletedAt).count();
    if (active >= FREE_PATIENT_LIMIT) throw new PlanLimitError();
  }

  const now = Date.now();
  const id = crypto.randomUUID();

  const newGuardian =
    guardian.kind === "new" ? buildGuardian(guardian, now) : undefined;
  const guardianId =
    guardian.kind === "existing" ? guardian.id : newGuardian?.id;

  const records: ImmunizationRecord[] = Object.entries(picked).map(
    ([key, dateGiven]) => {
      const vaccine = VACCINE_BY_KEY.get(key)!;
      return {
        id: crypto.randomUUID(),
        patientId: id,
        facilityId: config.facilityId,
        vaccineName: vaccine.vaccineName,
        doseNumber: vaccine.doseNumber,
        dateGiven,
        ...nextFor(vaccine, dateGiven),
        createdAt: now,
        updatedAt: now,
      };
    },
  );

  for (let attempt = 0; attempt < 5; attempt++) {
    const patient: Patient = {
      id,
      facilityId: config.facilityId,
      cardNumber: generateCardNumber(config.facilityCode),
      ...fieldsFrom(values),
      guardianId,
      createdAt: now,
      updatedAt: now,
      smsConsent: values.smsConsent ? true : undefined,
      smsConsentAt: values.smsConsent ? now : undefined,
      noticeAt: values.noticeGiven ? now : undefined,
      noticeVersion: values.noticeGiven ? NOTICE_VERSION : undefined,
    };
    try {
      await db.transaction(
        "rw",
        db.patients,
        db.immunizations,
        db.guardians,
        db.syncQueue,
        async () => {
          if (newGuardian) await db.guardians.add(newGuardian); // before the child that points at it
          await db.patients.add(patient);
          if (records.length) await db.immunizations.bulkAdd(records);
        },
      );
      void pushPending();
      return patient;
    } catch (e) {
      if (e instanceof Dexie.ConstraintError) continue;
      throw e;
    }
  }
  throw new Error("Could not create a unique card number");
}

export async function updatePatient(
  existing: Patient,
  values: PatientFormValues,
): Promise<Patient> {
  const now = Date.now();
  const fields = fieldsFrom(values);
  const phoneChanged = fields.phone !== existing.phone;
  // Consent was given for a specific number: a new number needs a fresh yes
  const consent = values.smsConsent && (!existing.smsConsent || !phoneChanged);
  const keepsDate = consent && !!existing.smsConsent;

  const changes = {
    ...fields,
    smsConsent: consent ? true : undefined,
    smsConsentAt: consent
      ? keepsDate
        ? existing.smsConsentAt
        : now
      : undefined,
    updatedAt: now,
  };
  await db.transaction("rw", db.patients, db.syncQueue, async () => {
    await db.patients.update(existing.id, changes);
  });
  void pushPending();
  return { ...existing, ...changes };
}

export async function setPatientDeleted(id: string, deleted: boolean) {
  const now = Date.now();
  await db.transaction("rw", db.patients, db.syncQueue, async () => {
    await db.patients.update(id, {
      deletedAt: deleted ? now : undefined,
      updatedAt: now,
    });
  });
  void pushPending();
}
