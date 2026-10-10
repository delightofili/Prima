import { addDays } from "./utils";

export interface VaccineOption {
  key: string;
  label: string;
  vaccineName: string;
  doseNumber: number;
  next?: { key: string; afterDays: number };
  quick?: boolean;
}

export const VACCINES: VaccineOption[] = [
  { key: "bcg", label: "BCG", vaccineName: "BCG", doseNumber: 1, quick: true },
  { key: "hepb0", label: "Hep B 0", vaccineName: "HepB", doseNumber: 0 },
  {
    key: "opv0",
    label: "OPV 0",
    vaccineName: "OPV",
    doseNumber: 0,
    next: { key: "opv1", afterDays: 42 },
    quick: true,
  },
  {
    key: "opv1",
    label: "OPV 1",
    vaccineName: "OPV",
    doseNumber: 1,
    next: { key: "opv2", afterDays: 28 },
    quick: true,
  },
  {
    key: "opv2",
    label: "OPV 2",
    vaccineName: "OPV",
    doseNumber: 2,
    next: { key: "opv3", afterDays: 28 },
  },
  { key: "opv3", label: "OPV 3", vaccineName: "OPV", doseNumber: 3 },
  {
    key: "penta1",
    label: "Penta 1",
    vaccineName: "Penta",
    doseNumber: 1,
    next: { key: "penta2", afterDays: 28 },
    quick: true,
  },
  {
    key: "penta2",
    label: "Penta 2",
    vaccineName: "Penta",
    doseNumber: 2,
    next: { key: "penta3", afterDays: 28 },
  },
  { key: "penta3", label: "Penta 3", vaccineName: "Penta", doseNumber: 3 },
  {
    key: "pcv1",
    label: "PCV 1",
    vaccineName: "PCV",
    doseNumber: 1,
    next: { key: "pcv2", afterDays: 28 },
    quick: true,
  },
  {
    key: "pcv2",
    label: "PCV 2",
    vaccineName: "PCV",
    doseNumber: 2,
    next: { key: "pcv3", afterDays: 28 },
  },
  { key: "pcv3", label: "PCV 3", vaccineName: "PCV", doseNumber: 3 },
  {
    key: "rota1",
    label: "Rota 1",
    vaccineName: "Rota",
    doseNumber: 1,
    next: { key: "rota2", afterDays: 28 },
  },
  { key: "rota2", label: "Rota 2", vaccineName: "Rota", doseNumber: 2 },
  { key: "ipv", label: "IPV", vaccineName: "IPV", doseNumber: 1 },
  {
    key: "measles1",
    label: "Measles 1",
    vaccineName: "Measles",
    doseNumber: 1,
    next: { key: "measles2", afterDays: 183 },
    quick: true,
  },
  {
    key: "yf",
    label: "Yellow fever",
    vaccineName: "Yellow fever",
    doseNumber: 1,
  },
  {
    key: "measles2",
    label: "Measles 2",
    vaccineName: "Measles",
    doseNumber: 2,
  },
];

export const VACCINE_BY_KEY = new Map(VACCINES.map((v) => [v.key, v] as const));
const BY_DOSE = new Map(
  VACCINES.map((v) => [`${v.vaccineName}|${v.doseNumber}`, v] as const),
);

export function nextLabelFor(
  vaccineName: string,
  doseNumber: number,
): string | undefined {
  const v = BY_DOSE.get(`${vaccineName}|${doseNumber}`);
  return v?.next ? VACCINE_BY_KEY.get(v.next.key)?.label : undefined;
}

export function nextFor(v: VaccineOption, dateGiven: string) {
  if (!v.next) return {};
  return {
    nextDueDate: addDays(dateGiven, v.next.afterDays),
    nextVaccineLabel: VACCINE_BY_KEY.get(v.next.key)?.label,
  };
}

export const VACCINE_BY_LABEL = new Map(
  VACCINES.map((v) => [v.label, v] as const),
);
