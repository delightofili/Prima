import { db } from "../db";
import { en, type Key } from "../i18n/locales/en";
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

// The same relationships as words in the dictionary, so a screen can show them in the person's language
export const RELATIONSHIP_KEY: Record<Relationship, Key> = {
  MOTHER: "rel.mother",
  FATHER: "rel.father",
  GRANDPARENT: "rel.grandparent",
  SIBLING: "rel.sibling",
  AUNT_UNCLE: "rel.auntUncle",
  OTHER: "rel.other",
};
export const relationshipKey = (r: Relationship): Key =>
  RELATIONSHIP_KEY[r] ?? "rel.guardian";

export type GuardianChoice =
  | { kind: "none" }
  | { kind: "existing"; id: string }
  | {
      kind: "new";
      fullName: string;
      phone: string;
      relationship: Relationship;
      patientId?: string;
      smsConsent: boolean;
    };

type NewChoice = Extract<GuardianChoice, { kind: "new" }>;

// An error that carries a dictionary key, so the screen can show it in the person's language.
// Its message is still the English sentence, for anything that only reads error.message.
export class GuardianError extends Error {
  key: Key;
  constructor(key: Key) {
    super(en[key]);
    this.key = key;
    this.name = "GuardianError";
  }
}

// What is wrong with a guardian form, as a dictionary key (or null when it is fine)
export function guardianChoiceError(c: GuardianChoice): Key | null {
  if (c.kind !== "new") return null;
  if (c.fullName.trim().length < 2) return "guardian.errName";
  if (c.phone.trim() && !toE164(c.phone)) return "guardian.errPhone";
  if (c.smsConsent && !toE164(c.phone)) return "guardian.errSmsPhone";
  return null;
}

// The same check as an English sentence, for code that has not been converted
export function validateGuardianChoice(c: GuardianChoice): string | null {
  const key = guardianChoiceError(c);
  return key ? en[key] : null;
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
    smsConsent: c.smsConsent ? true : undefined,
    smsConsentAt: c.smsConsent ? now : undefined,
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
    throw new GuardianError("guardian.errSelf");
  if (choice.kind === "existing") {
    const g = await db.guardians.get(choice.id);
    if (g?.patientId === patient.id)
      throw new GuardianError("guardian.errSelf");
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
    const current = await db.guardians.get(id);
    const phone = toE164(v.phone);
    const phoneChanged = phone !== current?.phone;
    await db.guardians.update(id, {
      fullName: v.fullName.trim(),
      name: normalize(v.fullName),
      phone,
      relationship: v.relationship,
      // Consent was given for a specific number: a new number needs a fresh yes
      ...(phoneChanged
        ? { smsConsent: undefined, smsConsentAt: undefined }
        : {}),
      updatedAt: Date.now(),
    });
  });
  void pushPending();
}
