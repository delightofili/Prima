export type Flag = "normal" | "warn" | "danger";
export interface Reading {
  flag: Flag;
  note?: string;
}

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
