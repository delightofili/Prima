import { db } from "../db";
import { config } from "./config";
import { pushPending } from "./syncService";
import { normalize, toE164 } from "./utils";
import type { Guardian, Patient, Relationship } from "../types";

export const ANC_CODE = "Z34.9"; // ICD-10: supervision of normal pregnancy

export const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "MOTHER", label: "Mother" },
  { value: "FATHER", label: "Father" },
  { value: "GRANDPARENT", label: "Grandparent" },
  { value: "SIBLING", label: "Brother or sister" },
  { value: "AUNT_UNCLE", label: "Aunt or uncle" },
  { value: "OTHER", label: "Other" },
];

const LABELS = new Map(RELATIONSHIPS.map((r) => [r.value, r.label] as const));
export const relationshipLabel = (r: Relationship) =>
  LABELS.get(r) ?? "Guardian";

export type GuardianChoice =
  | { kind: "none" }
  | { kind: "existing"; id: string }
  | {
      kind: "new";
      fullName: string;
      phone: string;
      relationship: Relationship;
      patientId?: string;
    };

type NewChoice = Extract<GuardianChoice, { kind: "new" }>;

const SELF = "A person cannot be their own guardian.";

export function validateGuardianChoice(c: GuardianChoice): string | null {
  if (c.kind !== "new") return null;
  if (c.fullName.trim().length < 2) return "Enter the guardian's name.";
  if (c.phone.trim() && !toE164(c.phone))
    return "Enter a valid Nigerian phone number for the guardian.";
  return null;
}

export function buildGuardian(c: NewChoice, now = Date.now()): Guardian {
  return {
    id: crypto.randomUUID(),
    facilityId: config.facilityId,
    fullName: c.fullName.trim(),
    name: normalize(c.fullName),
    phone: toE164(c.phone),
    relationship: c.relationship,
    patientId: c.patientId,
    createdAt: now,
    updatedAt: now,
  };
}

export function searchGuardians(
  guardians: Guardian[],
  raw: string,
  limit = 5,
): Guardian[] {
  const q = raw.trim();
  if (q.length < 2) return [];
  const term = normalize(q);
  const digits = q.replace(/\D/g, "");
  const local = digits.startsWith("234")
    ? digits.slice(3)
    : digits.replace(/^0/, "");
  return guardians
    .filter(
      (g) =>
        g.name.includes(term) ||
        (local.length >= 3 && (g.phone?.slice(4).includes(local) ?? false)),
    )
    .slice(0, limit);
}

export async function setGuardianOf(
  patientId: string,
  guardianId: string | undefined,
) {
  const now = Date.now();
  await db.transaction("rw", db.patients, db.syncQueue, async () => {
    await db.patients.update(patientId, { guardianId, updatedAt: now });
  });
  void pushPending();
}

export const detachGuardian = (patientId: string) =>
  setGuardianOf(patientId, undefined);

export async function attachGuardian(patient: Patient, choice: GuardianChoice) {
  if (choice.kind === "none") return detachGuardian(patient.id);

  if (choice.kind === "new" && choice.patientId === patient.id)
    throw new Error(SELF);
  if (choice.kind === "existing") {
    const g = await db.guardians.get(choice.id);
    if (g?.patientId === patient.id) throw new Error(SELF);
  }

  const now = Date.now();
  await db.transaction(
    "rw",
    db.guardians,
    db.patients,
    db.syncQueue,
    async () => {
      let guardianId: string;
      if (choice.kind === "existing") {
        guardianId = choice.id;
      } else {
        const g = buildGuardian(choice, now);
        await db.guardians.add(g); // saved before the patient points at it
        guardianId = g.id;
      }
      await db.patients.update(patient.id, { guardianId, updatedAt: now });
    },
  );
  void pushPending();
}

export async function updateGuardian(
  id: string,
  v: { fullName: string; phone: string; relationship: Relationship },
) {
  await db.transaction("rw", db.guardians, db.syncQueue, async () => {
    await db.guardians.update(id, {
      fullName: v.fullName.trim(),
      name: normalize(v.fullName),
      phone: toE164(v.phone),
      relationship: v.relationship,
      updatedAt: Date.now(),
    });
  });
  void pushPending();
}
