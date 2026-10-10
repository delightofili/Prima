import { db } from "../db";
import { addDays } from "./utils";
import { VACCINE_BY_LABEL } from "./vaccines";

export interface FollowUp {
  key: string;
  patientId: string;
  kind: "visit" | "vaccine";
  title: string;
  dueDate: string;
}

export async function loadFollowUps(
  windowDays: number,
  today: string,
): Promise<FollowUp[]> {
  const limit = addDays(today, windowDays);
  const items = new Map<string, FollowUp>();

  // 1) Follow-up visits: only the patient's latest visit counts.
  const dueVisits = await db.visits
    .where("nextDueDate")
    .belowOrEqual(limit)
    .filter((v) => !v.deletedAt)
    .toArray();

  for (const v of dueVisits) {
    if (!v.nextDueDate) continue;
    const mine = await db.visits
      .where("patientId")
      .equals(v.patientId)
      .filter((x) => !x.deletedAt)
      .toArray();
    const latest = mine.reduce((a, b) =>
      b.visitDate > a.visitDate ||
      (b.visitDate === a.visitDate && b.createdAt > a.createdAt)
        ? b
        : a,
    );
    if (latest.id !== v.id) continue;
    items.set(`visit:${v.patientId}`, {
      key: `visit:${v.id}`,
      patientId: v.patientId,
      kind: "visit",
      title: "Follow-up visit",
      dueDate: v.nextDueDate,
    });
  }

  // 2) Next vaccine doses that have not been recorded yet.
  const dueShots = await db.immunizations
    .where("nextDueDate")
    .belowOrEqual(limit)
    .filter((r) => !r.deletedAt && !!r.nextVaccineLabel)
    .toArray();

  for (const r of dueShots) {
    const next = VACCINE_BY_LABEL.get(r.nextVaccineLabel!);
    if (!next || !r.nextDueDate) continue;
    const mine = await db.immunizations
      .where("patientId")
      .equals(r.patientId)
      .filter((x) => !x.deletedAt)
      .toArray();
    if (
      mine.some(
        (x) =>
          x.vaccineName === next.vaccineName &&
          x.doseNumber === next.doseNumber,
      )
    )
      continue;
    items.set(`${r.patientId}|${next.key}`, {
      key: `vaccine:${r.id}`,
      patientId: r.patientId,
      kind: "vaccine",
      title: next.label,
      dueDate: r.nextDueDate,
    });
  }

  return [...items.values()];
}
