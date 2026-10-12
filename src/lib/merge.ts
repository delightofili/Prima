import { db } from "../db";
import { pushPending } from "./syncService";
import { normalize } from "./utils";
import type { Patient } from "../types";

export interface MergePlan {
  keep: Patient;
  drop: Patient;
  visitIds: string[];
  moveShotIds: string[];
  skipShotIds: string[];
  fills: Partial<Patient>;
  before: Partial<Patient>;
  filled: string[];
  differences: string[];
}

const LABELS: Partial<Record<keyof Patient, string>> = {
  phone: "phone",
  nhisNumber: "NHIS number",
  bloodGroup: "blood group",
  allergies: "allergies (combined)",
  initialChiefComplaint: "reason for first registration",
  para: "para",
  gravida: "gravida",
};

export async function planMerge(
  keep: Patient,
  drop: Patient,
): Promise<MergePlan> {
  const visits = await db.visits
    .where("patientId")
    .equals(drop.id)
    .filter((v) => !v.deletedAt)
    .toArray();
  const dropShots = await db.immunizations
    .where("patientId")
    .equals(drop.id)
    .filter((r) => !r.deletedAt)
    .toArray();
  const keepShots = await db.immunizations
    .where("patientId")
    .equals(keep.id)
    .filter((r) => !r.deletedAt)
    .toArray();

  // A dose already recorded on the kept record is not added twice
  const have = new Set(
    keepShots.map((r) => `${r.vaccineName}|${r.doseNumber}`),
  );
  const moveShotIds: string[] = [];
  const skipShotIds: string[] = [];
  for (const r of dropShots) {
    const key = `${r.vaccineName}|${r.doseNumber}`;
    if (have.has(key)) skipShotIds.push(r.id);
    else {
      moveShotIds.push(r.id);
      have.add(key);
    }
  }

  const fills: Partial<Patient> = {};
  const before: Partial<Patient> = {};
  const filled: string[] = [];
  const setFill = (key: keyof Patient, value: unknown) => {
    Object.assign(fills, { [key]: value });
    Object.assign(before, { [key]: keep[key] });
    filled.push(LABELS[key] ?? String(key));
  };

  if (!keep.phone && drop.phone) setFill("phone", drop.phone);
  if (!keep.nhisNumber && drop.nhisNumber)
    setFill("nhisNumber", drop.nhisNumber);
  if (!keep.bloodGroup && drop.bloodGroup)
    setFill("bloodGroup", drop.bloodGroup);
  if (!keep.initialChiefComplaint && drop.initialChiefComplaint) {
    setFill("initialChiefComplaint", drop.initialChiefComplaint);
  }
  if (keep.para === undefined && drop.para !== undefined)
    setFill("para", drop.para);
  if (keep.gravida === undefined && drop.gravida !== undefined)
    setFill("gravida", drop.gravida);

  // Allergies are safety-critical: never lose one.
  const ka = keep.allergies?.trim();
  const da = drop.allergies?.trim();
  if (da && !ka) setFill("allergies", da);
  else if (da && ka && normalize(da) !== normalize(ka))
    setFill("allergies", `${ka}; ${da}`);

  const differences: string[] = [];
  const diff = (label: string, kept?: string, other?: string) => {
    if (kept && other && kept !== other)
      differences.push(`${label}: ${kept} (kept) and ${other}`);
  };
  diff("Village", keep.village, drop.village);
  diff("Date of birth", keep.dob, drop.dob);
  diff("Phone", keep.phone, drop.phone);
  diff("Next of kin", keep.nextOfKinName, drop.nextOfKinName);
  diff("Next of kin phone", keep.nextOfKinPhone, drop.nextOfKinPhone);
  if (keep.isPregnant !== drop.isPregnant) {
    differences.push(
      `Pregnant: ${keep.isPregnant ? "Yes" : "No"} (kept) and ${drop.isPregnant ? "Yes" : "No"}`,
    );
  }

  return {
    keep,
    drop,
    visitIds: visits.map((v) => v.id),
    moveShotIds,
    skipShotIds,
    fills,
    before,
    filled,
    differences,
  };
}

export async function executeMerge(plan: MergePlan) {
  const now = Date.now();
  await db.transaction(
    "rw",
    db.patients,
    db.visits,
    db.immunizations,
    db.syncQueue,
    async () => {
      await db.patients.update(plan.keep.id, { ...plan.fills, updatedAt: now });
      for (const id of plan.visitIds)
        await db.visits.update(id, { patientId: plan.keep.id, updatedAt: now });
      for (const id of plan.moveShotIds) {
        await db.immunizations.update(id, {
          patientId: plan.keep.id,
          updatedAt: now,
        });
      }
      for (const id of plan.skipShotIds) {
        await db.immunizations.update(id, { deletedAt: now, updatedAt: now });
      }
      await db.patients.update(plan.drop.id, {
        deletedAt: now,
        mergedIntoId: plan.keep.id,
        updatedAt: now,
      });
    },
  );
  void pushPending();
}

export async function undoMerge(plan: MergePlan) {
  const now = Date.now();
  await db.transaction(
    "rw",
    db.patients,
    db.visits,
    db.immunizations,
    db.syncQueue,
    async () => {
      await db.patients.update(plan.drop.id, {
        deletedAt: undefined,
        mergedIntoId: undefined,
        updatedAt: now,
      });
      for (const id of plan.visitIds)
        await db.visits.update(id, { patientId: plan.drop.id, updatedAt: now });
      for (const id of plan.moveShotIds) {
        await db.immunizations.update(id, {
          patientId: plan.drop.id,
          updatedAt: now,
        });
      }
      for (const id of plan.skipShotIds) {
        await db.immunizations.update(id, {
          deletedAt: undefined,
          updatedAt: now,
        });
      }
      await db.patients.update(plan.keep.id, {
        ...plan.before,
        updatedAt: now,
      });
    },
  );
  void pushPending();
}
