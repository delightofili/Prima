import { calculateAge, isWomanOver12 } from "./age";
import { estimateDob, isoLocal } from "./estimateDob";
import type { PatientFormValues } from "./schema";
import { toE164 } from "./utils";

export type AgeMode = "age" | "date";

export interface QuickInput {
  fullName: string;
  gender: "MALE" | "FEMALE" | "";
  ageMode: AgeMode;
  ageValue: string; // digits as typed
  ageUnit: "years" | "months";
  dob: string; // used when ageMode is "date"
  village: string;
  phone: string;
  complaint: string;
  registrationOnly: boolean; // registering now, no visit to record
  pregnant: boolean;
  noticeGiven: boolean;
}

export const emptyQuick = (): QuickInput => ({
  fullName: "",
  gender: "",
  ageMode: "age",
  ageValue: "",
  ageUnit: "years",
  dob: "",
  village: "",
  phone: "",
  complaint: "",
  registrationOnly: false,
  pregnant: false,
  noticeGiven: false,
});

export type QuickErrors = Partial<
  Record<
    "fullName" | "gender" | "age" | "dob" | "village" | "phone" | "complaint",
    string
  >
>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DIGITS = /^\d{1,3}$/;

// The birth date to save: the real one if it was typed, otherwise an estimate from the age
export function dobFrom(
  q: QuickInput,
  today: Date = new Date(),
): string | null {
  if (q.ageMode === "date") return DATE.test(q.dob) ? q.dob : null;
  const v = q.ageValue.trim();
  return DIGITS.test(v) ? estimateDob(Number(v), q.ageUnit, today) : null;
}

export function validateQuick(
  q: QuickInput,
  today: Date = new Date(),
): QuickErrors {
  const e: QuickErrors = {};

  const name = q.fullName.trim();
  if (name.length === 0) e.fullName = "Enter the patient's name";
  else if (name.length < 2) e.fullName = "Name is too short";
  else if (name.length > 100) e.fullName = "Name is too long";

  if (!q.gender) e.gender = "Select female or male";

  if (q.ageMode === "age") {
    const v = q.ageValue.trim();
    if (!DIGITS.test(v)) e.age = "Enter the age as a number";
    else {
      const n = Number(v);
      if (q.ageUnit === "years" && n < 1)
        e.age = "For a baby under 1 year, choose months";
      else if (q.ageUnit === "years" && n > 120)
        e.age = "Age cannot be more than 120 years";
      else if (q.ageUnit === "months" && n > 59)
        e.age = "Over 59 months, choose years";
    }
  } else if (!DATE.test(q.dob)) {
    e.dob = "Enter the date of birth";
  } else if (q.dob > isoLocal(today)) {
    e.dob = "Date of birth cannot be in the future";
  } else {
    const age = calculateAge(q.dob, today);
    if (age.unit === "years" && age.value > 120)
      e.dob = "Check the date of birth";
  }

  const village = q.village.trim();
  if (village.length < 2) e.village = "Enter the village or area";
  else if (village.length > 100) e.village = "Village name is too long";

  if (q.phone.trim() && !toE164(q.phone))
    e.phone = "Enter a valid Nigerian number, e.g. 08031234567";

  if (!q.registrationOnly) {
    const c = q.complaint.trim();
    if (c.length < 3)
      e.complaint = "Say why the patient came, or tick Registration only";
    else if (c.length > 200) e.complaint = "Keep it under 200 characters";
  }
  return e;
}

// Can the "Pregnant now" box be shown? A woman over 12 and under 50.
export function canBePregnant(
  gender: string,
  dob: string | null,
  today: Date = new Date(),
): boolean {
  if (!dob || gender !== "FEMALE") return false;
  const age = calculateAge(dob, today);
  return isWomanOver12(gender, age) && age.value < 50;
}

// What the full registration function expects. Next of kin is left empty on purpose: the profile asks for it later.
export function quickToValues(
  q: QuickInput,
  facility: { lga: string; state: string },
  today: Date = new Date(),
): PatientFormValues {
  const dob = dobFrom(q, today);
  if (!dob || !q.gender) throw new Error("Check the form before converting it");
  return {
    isNewAdmission: !q.registrationOnly,
    initialChiefComplaint: q.registrationOnly ? "" : q.complaint.trim(),
    fullName: q.fullName.trim(),
    dob,
    gender: q.gender,
    phone: q.phone.trim(),
    village: q.village.trim(),
    lga: facility.lga,
    state: facility.state,
    nextOfKinName: "",
    nextOfKinPhone: "",
    nhisNumber: "",
    bloodGroup: "",
    allergies: "",
    para: undefined,
    gravida: undefined,
    isPregnant: q.pregnant && canBePregnant(q.gender, dob, today),
    noticeGiven: q.noticeGiven,
    dobEstimated: q.ageMode === "age",
    smsConsent: false,
  };
}
