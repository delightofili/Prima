import { z } from "zod";
import { BLOOD_GROUPS } from "../types";
import { calculateAge, isWomanOver12 } from "./age";
import { todayISO, toE164 } from "./utils";
import { VACCINE_BY_KEY } from "./vaccines";

const PHONE_MSG =
  "Enter a valid Nigerian number, e.g. 08031234567 or +2348031234567";

const required = (label: string, max = 100) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .min(2, `${label} is too short`)
    .max(max, `${label} is too long`);

export const patientFormSchema = z
  .object({
    isNewAdmission: z.boolean(),
    initialChiefComplaint: z
      .string()
      .trim()
      .max(200, "Keep it under 200 characters")
      .optional(),
    fullName: required("Full name"),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date of birth")
      .refine((s) => s <= todayISO(), "Date of birth cannot be in the future"),
    gender: z.enum(["MALE", "FEMALE"], {
      errorMap: () => ({ message: "Select male or female" }),
    }),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || toE164(v) !== undefined, PHONE_MSG)
      .optional(),
    village: required("Village"),
    lga: required("LGA"),
    state: required("State"),
    nextOfKinName: required("Next of kin name"),
    nextOfKinPhone: z
      .string()
      .trim()
      .refine((v) => toE164(v) !== undefined, PHONE_MSG),
    nhisNumber: z.string().trim().max(30).optional(),
    bloodGroup: z.enum(BLOOD_GROUPS).or(z.literal("")).optional(),
    allergies: z.string().trim().max(500, "Too long").optional(),
    para: z
      .number({ invalid_type_error: "Enter a number" })
      .int()
      .min(0)
      .max(20)
      .optional(),
    gravida: z
      .number({ invalid_type_error: "Enter a number" })
      .int()
      .min(0)
      .max(20)
      .optional(),
    isPregnant: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    if (d.isNewAdmission && (d.initialChiefComplaint?.length ?? 0) < 5) {
      issue(
        "initialChiefComplaint",
        "Describe the reason for the visit (at least 5 characters)",
      );
    }

    const age = calculateAge(d.dob);
    if (!isWomanOver12(d.gender, age)) {
      if (d.para !== undefined)
        issue("para", "Only for female patients over 12");
      if (d.gravida !== undefined)
        issue("gravida", "Only for female patients over 12");
      if (d.isPregnant) issue("isPregnant", "Only for female patients over 12");
    }
    if (d.para !== undefined && d.gravida !== undefined && d.para > d.gravida) {
      issue("para", "Para cannot be more than gravida");
    }
  });

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export function validateImmunizations(
  dob: string,
  picked: Record<string, string>,
): string | null {
  for (const [key, date] of Object.entries(picked)) {
    const label = VACCINE_BY_KEY.get(key)?.label ?? key;
    if (!date) return `Enter the date ${label} was given`;
    if (date > todayISO()) return `${label} date cannot be in the future`;
    if (date < dob) return `${label} cannot be given before the date of birth`;
  }
  return null;
}
