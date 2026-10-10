import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { calculateAge, isUnder5 } from "../lib/age";
import { loadFollowUps, type FollowUp } from "../lib/followups";
import { daysBetween, todayISO } from "../lib/utils";
import type { Patient } from "../types";
import { usePatients } from "./usePatients";

export interface FollowUpItem extends FollowUp {
  patient: Patient;
  days: number; // negative = overdue
}

export function useFollowUps(windowDays: number): FollowUpItem[] | null {
  const { patientMap, loading } = usePatients("");
  const raw = useLiveQuery(
    () => loadFollowUps(windowDays, todayISO()),
    [windowDays],
  );

  return useMemo(() => {
    if (!raw || loading) return null;
    const today = todayISO();
    return raw
      .flatMap((f) => {
        const patient = patientMap.get(f.patientId);
        if (!patient) return [];
        // Routine vaccine reminders only apply to children under 5
        if (f.kind === "vaccine" && !isUnder5(calculateAge(patient.dob)))
          return [];
        return [{ ...f, patient, days: daysBetween(today, f.dueDate) }];
      })
      .sort(
        (a, b) =>
          a.dueDate.localeCompare(b.dueDate) ||
          a.patient.fullName.localeCompare(b.patient.fullName),
      );
  }, [raw, patientMap, loading]);
}
