export interface VaccineOption {
  key: string;
  label: string;
  vaccineName: string;
  doseNumber: number;
  nextAfterDays?: number;
}

export const VACCINES: VaccineOption[] = [
  { key: "bcg", label: "BCG", vaccineName: "BCG", doseNumber: 1 },
  {
    key: "opv0",
    label: "OPV 0",
    vaccineName: "OPV",
    doseNumber: 0,
    nextAfterDays: 42,
  },
  {
    key: "opv1",
    label: "OPV 1",
    vaccineName: "OPV",
    doseNumber: 1,
    nextAfterDays: 28,
  },
  {
    key: "penta1",
    label: "Penta 1",
    vaccineName: "Penta",
    doseNumber: 1,
    nextAfterDays: 28,
  },
  {
    key: "pcv1",
    label: "PCV 1",
    vaccineName: "PCV",
    doseNumber: 1,
    nextAfterDays: 28,
  },
  {
    key: "measles1",
    label: "Measles 1",
    vaccineName: "Measles",
    doseNumber: 1,
  },
];

export const VACCINE_BY_KEY = new Map(VACCINES.map((v) => [v.key, v] as const));
