import Dexie from "dexie";
import { db } from "../db";
import { config } from "./config";
import { generateCardNumber, normalize, addDays } from "./utils";
import { VACCINE_BY_KEY } from "./vaccines";
import { pushPending } from "./syncService";
import type { PatientFormValues } from "./schema";
import type { ImmunizationRecord, Patient } from "../types";

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : undefined;
};

export async function findExactDuplicate(
  fullName: string,
  dob: string,
  village: string,
) {
  if (!fullName.trim() || !dob || !village.trim()) return undefined;
  return db.patients
    .where("[name+dob+villageKey]")
    .equals([normalize(fullName), dob, normalize(village)])
    .first();
}

export async function registerPatient(
  values: PatientFormValues,
  picked: Record<string, string>,
): Promise<Patient> {
  const now = Date.now();
  const id = crypto.randomUUID();

  const records: ImmunizationRecord[] = Object.entries(picked).map(
    ([key, dateGiven]) => {
      const vaccine = VACCINE_BY_KEY.get(key)!;
      return {
        id: crypto.randomUUID(),
        patientId: id,
        vaccineName: vaccine.vaccineName,
        doseNumber: vaccine.doseNumber,
        dateGiven,
        nextDueDate: vaccine.nextAfterDays
          ? addDays(dateGiven, vaccine.nextAfterDays)
          : undefined,
        createdAt: now,
      };
    },
  );

  for (let attempt = 0; attempt < 5; attempt++) {
    const patient: Patient = {
      id,
      facilityId: config.facilityId,
      cardNumber: generateCardNumber(config.facilityCode),
      fullName: values.fullName.trim(),
      name: normalize(values.fullName),
      dob: values.dob,
      gender: values.gender,
      phone: clean(values.phone),
      village: values.village.trim(),
      villageKey: normalize(values.village),
      lga: values.lga.trim(),
      state: values.state.trim(),
      nextOfKinName: values.nextOfKinName.trim(),
      nextOfKinPhone: values.nextOfKinPhone.trim(),
      nhisNumber: clean(values.nhisNumber),
      bloodGroup: values.bloodGroup || undefined,
      allergies: clean(values.allergies),
      para: values.para,
      gravida: values.gravida,
      isPregnant: values.isPregnant,
      initialChiefComplaint: values.isNewAdmission
        ? clean(values.initialChiefComplaint)
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.transaction(
        "rw",
        db.patients,
        db.immunizations,
        db.syncQueue,
        async () => {
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
