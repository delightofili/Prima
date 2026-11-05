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
  noticeAt?: number; // when the privacy notice was explained
  noticeVersion?: string;
  erasedAt?: number; // set only by the server's erase function
  dobEstimated?: boolean; // the birth date is a guess made from the age
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
  erasedAt?: number;
}

export interface AuditEntry {
  id: string;
  facilityId: string;
  actorId: string;
  actorName: string;
  action: string; // "patient.create", "visit.delete", "consent.sms.on" ...
  entityType?: string;
  entityId?: string;
  summary: string; // card numbers and field names only, never names or diagnoses
  createdAt: number;
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
  table:
    | "patients"
    | "immunizations"
    | "visits"
    | "guardians"
    | "reminders"
    | "audit";
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

/* 

src/components/AppShell.tsx	so the navigation stays alive when one screen crashes, and for a “skip to content” link
src/index.css	your colour tokens and focus styles, for the accessibility pass
src/db.ts	demo mode needs a separate practice database that can never mix with real data
src/components/AuthScreens.tsx, plus src/hooks/useAuth.ts or AuthProvider.tsx	the onboarding wizard goes after sign-up
src/components/PrivacyCard.tsx (and wherever the privacy notice and SMS consent text live)	the legal wording review
the current landing page index.html	I’ll update it from your file, not from my old copy, in case you changed it after I gave you prima-landing.zip

Still outstanding from Day 26: PlansPage.tsx, PlanCard.tsx, lib/plan.ts, hooks/usePlan.ts.


*/
