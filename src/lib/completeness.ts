import { calculateAge, isUnder5 } from "./age";
import type { Patient } from "../types";

// What a quick registration left for later. The words for each gap live in the dictionary (see CompleteRecordCard).
export type GapKey = "nextOfKin" | "birthDate" | "guardian";

export function recordGaps(p: Patient, today: Date = new Date()): GapKey[] {
  const gaps: GapKey[] = [];
  if (!p.nextOfKinName.trim() || !p.nextOfKinPhone.trim())
    gaps.push("nextOfKin");
  if (p.dobEstimated) gaps.push("birthDate");
  if (isUnder5(calculateAge(p.dob, today)) && !p.guardianId)
    gaps.push("guardian");
  return gaps;
}
