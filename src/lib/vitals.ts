import type { Key } from "../i18n/locales/en";

export type Flag = "normal" | "warn" | "danger";
export interface Reading {
  flag: Flag;
  note?: string;
}

// The English note stays inside each reading (other code reads it). This table says which dictionary line
// shows the same note in the person's language; VitalChip uses it.
export const NOTE_KEY: Record<string, Key> = {
  "Very high": "vitals.veryHigh",
  High: "vitals.high",
  "High fever": "vitals.highFever",
  Fever: "vitals.fever",
  Low: "vitals.low",
};

export function bpReading(systolic: number, diastolic: number): Reading {
  if (systolic >= 180 || diastolic >= 120)
    return { flag: "danger", note: "Very high" };
  if (systolic >= 140 || diastolic >= 90) return { flag: "warn", note: "High" };
  return { flag: "normal" };
}

export function tempReading(celsius: number): Reading {
  if (celsius >= 39.5) return { flag: "danger", note: "High fever" };
  if (celsius >= 37.5) return { flag: "warn", note: "Fever" };
  if (celsius < 35) return { flag: "danger", note: "Low" };
  return { flag: "normal" };
}
