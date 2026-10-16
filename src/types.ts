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

export type ReminderKind = "visit" | "vaccine";
export type ReminderStatus = "pending" | "sent" | "cancelled";

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
  smsConsent?: boolean;
  smsConsentAt?: number;
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
  table: "patients" | "immunizations" | "visits" | "guardians" | "reminders";
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
  patientId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  smsConsent?: boolean;
  smsConsentAt?: number;
}

export interface Reminder {
  id: string;
  facilityId: string;
  patientId: string;
  kind: ReminderKind;
  sourceId: string;
  title: string;
  dueDate: string;
  sendOn: string;
  phone: string;
  recipient: "patient" | "guardian";
  message: string;
  status: ReminderStatus;
  sentAt?: number;
  createdAt: number;
  updatedAt: number;
}
