import { calculateAge, isUnder5, type Age } from "./age";
import { daysInMonth, monthOf } from "./utils";
import type { Patient, Visit } from "../types";

export interface Count {
  label: string;
  value: number;
}
export interface DayPoint {
  day: number;
  registrations: number;
  visits: number;
}
export interface DashboardStats {
  total: number;
  female: number;
  male: number;
  under5: number;
  pregnant: number;
  newInMonth: number;
  visitsInMonth: number;
  ageGroups: Count[];
  perDay: DayPoint[];
  topDiagnoses: Count[];
  topVillages: Count[];
}

const AGE_GROUPS = ["Under 1", "1-4", "5-14", "15-49", "50+"];

function ageGroup(a: Age): string {
  if (a.unit === "months") return "Under 1";
  if (a.value < 5) return "1-4";
  if (a.value < 15) return "5-14";
  if (a.value < 50) return "15-49";
  return "50+";
}

function top(counts: Map<string, number>, n = 5): Count[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

export function computeStats(
  patients: Patient[],
  visits: Visit[],
  patientMap: Map<string, Patient>,
  month: string,
): DashboardStats {
  const perDay: DayPoint[] = Array.from(
    { length: daysInMonth(month) },
    (_, i) => ({
      day: i + 1,
      registrations: 0,
      visits: 0,
    }),
  );
  const groups = new Map<string, number>(
    AGE_GROUPS.map((g): [string, number] => [g, 0]),
  );
  const villages = new Map<string, Count>();
  let female = 0;
  let male = 0;
  let under5 = 0;
  let pregnant = 0;
  let newInMonth = 0;

  for (const p of patients) {
    if (p.gender === "FEMALE") female++;
    else male++;
    if (p.isPregnant) pregnant++;

    const age = calculateAge(p.dob);
    if (isUnder5(age)) under5++;
    const g = ageGroup(age);
    groups.set(g, (groups.get(g) ?? 0) + 1);

    const v = villages.get(p.villageKey);
    if (v) v.value++;
    else villages.set(p.villageKey, { label: p.village, value: 1 });

    const created = new Date(p.createdAt).toLocaleDateString("en-CA");
    if (monthOf(created) === month) {
      newInMonth++;
      const slot = perDay[Number(created.slice(8, 10)) - 1];
      if (slot) slot.registrations++;
    }
  }

  const diagnoses = new Map<string, number>();
  let visitsInMonth = 0;
  for (const v of visits) {
    if (v.deletedAt || !patientMap.has(v.patientId)) continue;
    if (monthOf(v.visitDate) !== month) continue;
    visitsInMonth++;
    const slot = perDay[Number(v.visitDate.slice(8, 10)) - 1];
    if (slot) slot.visits++;
    const label = v.diagnosisLabel?.trim();
    if (label) diagnoses.set(label, (diagnoses.get(label) ?? 0) + 1);
  }

  return {
    total: patients.length,
    female,
    male,
    under5,
    pregnant,
    newInMonth,
    visitsInMonth,
    ageGroups: AGE_GROUPS.map((label) => ({
      label,
      value: groups.get(label) ?? 0,
    })),
    perDay,
    topDiagnoses: top(diagnoses),
    topVillages: [...villages.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };
}
