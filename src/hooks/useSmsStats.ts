import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { resolveRecipient } from "../lib/reminders";
import { addDays, todayISO } from "../lib/utils";
import type { Patient, Reminder } from "../types";
import { useGuardians } from "./useGuardians";
import { usePatients } from "./usePatients";

export interface ReminderItem extends Reminder {
  patient: Patient;
}

export function useSmsStats() {
  const raw = useLiveQuery(() => db.reminders.toArray(), []);
  const { results: patients, patientMap, loading } = usePatients("");
  const { guardianMap } = useGuardians();

  return useMemo(() => {
    if (!raw || loading) return null;

    const soon = addDays(todayISO(), 7);
    const items: ReminderItem[] = [];
    let sent = 0;
    for (const r of raw) {
      if (r.status === "sent") sent++;
      if (r.status !== "pending") continue;
      const patient = patientMap.get(r.patientId);
      if (patient) items.push({ ...r, patient });
    }
    items.sort(
      (a, b) =>
        a.sendOn.localeCompare(b.sendOn) ||
        a.patient.fullName.localeCompare(b.patient.fullName),
    );

    const reachable = patients.filter(
      (p) =>
        resolveRecipient(
          p,
          p.guardianId ? guardianMap.get(p.guardianId) : undefined,
        ) !== null,
    ).length;

    return {
      items,
      pending: items.length,
      sendSoon: items.filter((i) => i.sendOn <= soon).length,
      sent,
      reachable,
      total: patients.length,
    };
  }, [raw, patients, patientMap, guardianMap, loading]);
}
