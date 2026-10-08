import { z } from "zod";
import { todayISO } from "./utils";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const whole = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} looks too low`)
    .max(max, `${label} looks too high`)
    .optional();

const decimal = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .min(min, `${label} looks too low`)
    .max(max, `${label} looks too high`)
    .optional();

export function makeVisitSchema(dob: string) {
  return z
    .object({
      visitDate: z
        .string()
        .regex(ISO, "Enter the visit date")
        .refine((s) => s <= todayISO(), "Visit date cannot be in the future")
        .refine((s) => s >= dob, "Visit cannot be before the date of birth"),
      complaints: z
        .string()
        .trim()
        .min(3, "Describe the complaint (at least 3 characters)")
        .max(500, "Keep it under 500 characters"),
      systolic: whole("Systolic", 50, 300),
      diastolic: whole("Diastolic", 30, 200),
      temperature: decimal("Temperature", 30, 45),
      weightKg: decimal("Weight", 0.5, 300),
      treatment: z
        .string()
        .trim()
        .max(500, "Keep it under 500 characters")
        .optional(),
      nextDueDate: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      if ((v.systolic === undefined) !== (v.diastolic === undefined)) {
        issue(
          v.systolic === undefined ? "systolic" : "diastolic",
          "Enter both BP values",
        );
      }
      if (
        v.systolic !== undefined &&
        v.diastolic !== undefined &&
        v.systolic <= v.diastolic
      ) {
        issue("diastolic", "Diastolic must be lower than systolic");
      }
      if (v.nextDueDate) {
        if (!ISO.test(v.nextDueDate))
          issue("nextDueDate", "Enter a valid date");
        else if (v.nextDueDate <= v.visitDate)
          issue("nextDueDate", "Follow-up must be after the visit date");
      }
    });
}

export type VisitFormValues = z.infer<ReturnType<typeof makeVisitSchema>>;
