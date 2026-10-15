export type Gender = "MALE" | "FEMALE";
export type Relationship =
  | "MOTHER"
  | "FATHER"
  | "GRANDPARENT"
  | "SIBLING"
  | "AUNT_UNCLE"
  | "OTHER";

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export interface Patient {
  id: string;
  facilityId: string;
  cardNumber: string;
  fullName: string;
  name: string;
  dob: string;
  gender: Gender;
  phone?: string;
  village: string;
  villageKey: string;
  lga: string;
  state: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nhisNumber?: string;
  bloodGroup?: BloodGroup;
  allergies?: string;
  para?: number;
  gravida?: number;
  isPregnant: boolean;
  initialChiefComplaint?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  mergedIntoId?: string;
  guardianId?: string;
}

export interface ImmunizationRecord {
  id: string;
  patientId: string;
  facilityId: string;
  vaccineName: string;
  doseNumber: number;
  dateGiven: string;
  nextDueDate?: string;
  nextVaccineLabel?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Visit {
  id: string;
  patientId: string;
  facilityId: string;
  visitDate: string;
  complaints: string;
  systolic?: number;
  diastolic?: number;
  temperature?: number;
  weightKg?: number;
  diagnosisCode?: string;
  diagnosisLabel?: string;
  treatment?: string;
  nextDueDate?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface MetaItem {
  key: string;
  value: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: number;
}

export interface SyncItem {
  id?: number;
  table: "patients" | "immunizations" | "visits" | "guardians";
  recordId: string;
  attempts: number;
  status: "pending" | "failed";
  lastError?: string;
  createdAt: number;
}

export interface Guardian {
  id: string;
  facilityId: string;
  fullName: string;
  name: string;
  phone?: string;
  relationship: Relationship;
  patientId?: string; // the guardian's own patient record, e.g. a mother in antenatal care
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
