const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

// A stand-in birth date for someone whose real date nobody knows: today, that many years or months ago.
// A 34-year-old registered today shows as 34 years today, and the profile says the date is an estimate.
// If that day does not exist in the earlier month (29 February, 31 April) the last day of the month is used.
export function estimateDob(
  value: number,
  unit: "years" | "months",
  today: Date = new Date(),
): string {
  const months = unit === "years" ? value * 12 : value;
  const target = today.getFullYear() * 12 + today.getMonth() - months;
  const year = Math.floor(target / 12);
  const month = ((target % 12) + 12) % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return iso(year, month, Math.min(today.getDate(), lastDay));
}

// The same date some years earlier or later, used to look for duplicates when a birth date is only an estimate
export function shiftYears(dob: string, years: number): string {
  const [y, m, d] = dob.split("-").map(Number);
  const lastDay = new Date(y + years, m, 0).getDate();
  return iso(y + years, m - 1, Math.min(d, lastDay));
}

export const isoLocal = (date: Date) =>
  iso(date.getFullYear(), date.getMonth(), date.getDate());
