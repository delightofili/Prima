import { z } from "zod";
import type { Key } from "../i18n/locales/en";
import { todayISO } from "./utils";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// A message here is a dictionary key, and sometimes a field name after a "|": "err.fieldLow|visit.weight".
// The screen turns it into the person's language (see tv in src/i18n). A wrong key is a type error.
const coded = (key: Key, label?: Key) => (label ? `${key}|${label}` : key);

const whole = (label: Key, min: number, max: number) =>
  z
    .number({ invalid_type_error: coded("err.fieldNumber", label) })
    .int(coded("err.fieldWhole", label))
    .min(min, coded("err.fieldLow", label))
    .max(max, coded("err.fieldHigh", label))
    .optional();

const decimal = (label: Key, min: number, max: number) =>
  z
    .number({ invalid_type_error: coded("err.fieldNumber", label) })
    .min(min, coded("err.fieldLow", label))
    .max(max, coded("err.fieldHigh", label))
    .optional();

export function makeVisitSchema(dob: string) {
  return z
    .object({
      visitDate: z
        .string()
        .regex(ISO, coded("err.visitDateRequired"))
        .refine((s) => s <= todayISO(), coded("err.visitFuture"))
        .refine((s) => s >= dob, coded("err.visitBeforeBirth")),
      complaints: z
        .string()
        .trim()
        .min(3, coded("err.complaintShort"))
        .max(500, coded("err.under500")),
      systolic: whole("visit.bpTop", 50, 300),
      diastolic: whole("visit.bpBottom", 30, 200),
      temperature: decimal("visit.temperature", 30, 45),
      weightKg: decimal("visit.weight", 0.5, 300),
      treatment: z.string().trim().max(500, coded("err.under500")).optional(),
      nextDueDate: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      if ((v.systolic === undefined) !== (v.diastolic === undefined)) {
        issue(
          v.systolic === undefined ? "systolic" : "diastolic",
          coded("err.bothBp"),
        );
      }
      if (
        v.systolic !== undefined &&
        v.diastolic !== undefined &&
        v.systolic <= v.diastolic
      ) {
        issue("diastolic", coded("err.diaLower"));
      }
      if (v.nextDueDate) {
        if (!ISO.test(v.nextDueDate))
          issue("nextDueDate", coded("err.validDate"));
        else if (v.nextDueDate <= v.visitDate)
          issue("nextDueDate", coded("err.followAfter"));
      }
    });
}

export type VisitFormValues = z.infer<ReturnType<typeof makeVisitSchema>>;
