export type Gender = "MALE" | "FEMALE";

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
}

export interface ImmunizationRecord {
  id: string;
  patientId: string;
  vaccineName: string;
  doseNumber: number;
  dateGiven: string;
  nextDueDate?: string;
  createdAt: number;
}

// Day 4 fills these in
export interface Visit {
  id: string;
  patientId: string;
  createdAt: number;
  nextDueDate?: string;
}
export interface User {
  id: string;
  username: string;
  createdAt: number;
}

export interface SyncItem {
  id?: number;
  table: "patients" | "immunizations";
  recordId: string;
  attempts: number;
  status: "pending" | "failed";
  lastError?: string;
  createdAt: number;
}
