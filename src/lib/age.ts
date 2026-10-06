export type Age = { value: number; unit: "months" | "years"; label: string };

export function calculateAge(dob: string, today: Date = new Date()): Age {
  const [y, m, d] = dob.split("-").map(Number);
  let years = today.getFullYear() - y;
  let months = today.getMonth() + 1 - m;
  if (today.getDate() < d) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 1) {
    return {
      value: months,
      unit: "months",
      label: `${months} ${months === 1 ? "month" : "months"}`,
    };
  }
  return {
    value: years,
    unit: "years",
    label: `${years} ${years === 1 ? "year" : "years"}`,
  };
}

export const isUnder5 = (a: Age) => a.unit === "months" || a.value < 5;
export const isWomanOver12 = (gender: string, a: Age) =>
  gender === "FEMALE" && a.unit === "years" && a.value > 12;
