import type { Key } from "../i18n/locales/en";
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

// Each value is a message key (see the "err." lines in the English dictionary), never a sentence
export type QuickErrors = Partial<
  Record<
    "fullName" | "gender" | "age" | "dob" | "village" | "phone" | "complaint",
    Key
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
  if (name.length === 0) e.fullName = "err.nameRequired";
  else if (name.length < 2) e.fullName = "err.nameShort";
  else if (name.length > 100) e.fullName = "err.nameLong";

  if (!q.gender) e.gender = "err.sexRequired";

  if (q.ageMode === "age") {
    const v = q.ageValue.trim();
    if (!DIGITS.test(v)) e.age = "err.ageNumber";
    else {
      const n = Number(v);
      if (q.ageUnit === "years" && n < 1) e.age = "err.ageUseMonths";
      else if (q.ageUnit === "years" && n > 120) e.age = "err.ageTooOld";
      else if (q.ageUnit === "months" && n > 59) e.age = "err.ageUseYears";
    }
  } else if (!DATE.test(q.dob)) {
    e.dob = "err.dobRequired";
  } else if (q.dob > isoLocal(today)) {
    e.dob = "err.dobFuture";
  } else {
    const age = calculateAge(q.dob, today);
    if (age.unit === "years" && age.value > 120) e.dob = "err.dobCheck";
  }

  const village = q.village.trim();
  if (village.length < 2) e.village = "err.villageRequired";
  else if (village.length > 100) e.village = "err.villageLong";

  if (q.phone.trim() && !toE164(q.phone)) e.phone = "err.phoneInvalid";

  if (!q.registrationOnly) {
    const c = q.complaint.trim();
    if (c.length < 3) e.complaint = "err.reasonRequired";
    else if (c.length > 200) e.complaint = "err.reasonLong";
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
