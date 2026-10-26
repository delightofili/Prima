import { calculateAge, isUnder5 } from "./age";
import type { Patient } from "../types";

export interface Gap {
  key: "nextOfKin" | "birthDate" | "guardian";
  title: string;
  help: string;
}

// What a quick registration left for later
export function recordGaps(p: Patient, today: Date = new Date()): Gap[] {
  const gaps: Gap[] = [];
  if (!p.nextOfKinName.trim() || !p.nextOfKinPhone.trim()) {
    gaps.push({
      key: "nextOfKin",
      title: "Next of kin",
      help: "Someone to call if the patient cannot be reached.",
    });
  }
  if (p.dobEstimated) {
    gaps.push({
      key: "birthDate",
      title: "Birth date is an estimate",
      help: "Enter the real date when someone knows it.",
    });
  }
  if (isUnder5(calculateAge(p.dob, today)) && !p.guardianId) {
    gaps.push({
      key: "guardian",
      title: "Parent or guardian",
      help: "Needed for reminders and for the family record.",
    });
  }
  return gaps;
}
