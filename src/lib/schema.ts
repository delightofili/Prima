import { z } from "zod";
import type { Key } from "../i18n/locales/en";
import { BLOOD_GROUPS } from "../types";
import { calculateAge, isWomanOver12 } from "./age";
import { todayISO, toE164 } from "./utils";
import { VACCINE_BY_KEY } from "./vaccines";

// A message here is a dictionary key, and sometimes a field name after a "|": "err.fieldShort|register.fullName".
// The screen turns it into the person's language (see tv in src/i18n). A wrong key is a type error.
const coded = (key: Key, label?: string) => (label ? `${key}|${label}` : key);

const PHONE_MSG = coded("err.phoneInvalid");

const required = (label: Key, max = 100) =>
  z
    .string({ required_error: coded("err.fieldRequired", label) })
    .trim()
    .min(1, coded("err.fieldRequired", label))
    .min(2, coded("err.fieldShort", label))
    .max(max, coded("err.fieldLong", label));

export const patientFormSchema = z
  .object({
    isNewAdmission: z.boolean(),
    initialChiefComplaint: z
      .string()
      .trim()
      .max(200, coded("err.reasonLong"))
      .optional(),
    fullName: required("register.fullName"),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, coded("err.dobRequired"))
      .refine((s) => s <= todayISO(), coded("err.dobFuture")),
    gender: z.enum(["MALE", "FEMALE"], {
      errorMap: () => ({ message: coded("err.sexRequired") }),
    }),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || toE164(v) !== undefined, PHONE_MSG)
      .optional(),
    village: required("patient.village"),
    lga: required("facility.lga"),
    state: required("facility.state"),
    nextOfKinName: required("form.nokName"),
    nextOfKinPhone: z
      .string()
      .trim()
      .refine((v) => toE164(v) !== undefined, PHONE_MSG),
    nhisNumber: z.string().trim().max(30).optional(),
    bloodGroup: z.enum(BLOOD_GROUPS).or(z.literal("")).optional(),
    allergies: z.string().trim().max(500, coded("err.tooLong")).optional(),
    para: z
      .number({ invalid_type_error: coded("err.enterNumber") })
      .int()
      .min(0)
      .max(20)
      .optional(),
    gravida: z
      .number({ invalid_type_error: coded("err.enterNumber") })
      .int()
      .min(0)
      .max(20)
      .optional(),
    isPregnant: z.boolean(),
    dobEstimated: z.boolean().optional(),
    noticeGiven: z.boolean(),
    smsConsent: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    if (d.isNewAdmission && (d.initialChiefComplaint?.length ?? 0) < 3) {
      issue("initialChiefComplaint", coded("err.complaintShort"));
    }

    const age = calculateAge(d.dob);
    if (d.smsConsent) {
      const adult = age.unit === "years" && age.value >= 18;
      if (!adult) issue("smsConsent", coded("err.smsChildren"));
      else if (!toE164(d.phone ?? ""))
        issue("smsConsent", coded("err.smsPhone"));
    }
    if (!isWomanOver12(d.gender, age)) {
      if (d.para !== undefined) issue("para", coded("err.femaleOver12"));
      if (d.gravida !== undefined) issue("gravida", coded("err.femaleOver12"));
      if (d.isPregnant) issue("isPregnant", coded("err.femaleOver12"));
    }
    if (d.para !== undefined && d.gravida !== undefined && d.para > d.gravida) {
      issue("para", coded("err.paraGravida"));
    }
  });

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export function validateImmunizations(
  dob: string,
  picked: Record<string, string>,
): string | null {
  for (const [key, date] of Object.entries(picked)) {
    const label = VACCINE_BY_KEY.get(key)?.label ?? key;
    if (!date) return coded("err.vaccineDateMissing", label);
    if (date > todayISO()) return coded("err.vaccineFuture", label);
    if (date < dob) return coded("err.vaccineBeforeBirth", label);
  }
  return null;
}
