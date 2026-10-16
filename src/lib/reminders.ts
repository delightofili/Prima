import { liveQuery } from "dexie";
import { db } from "../db";
import { calculateAge, isUnder5 } from "./age";
import { config } from "./config";
import { pushPending } from "./syncService";
import { addDays, fromISO, todayISO } from "./utils";
import { VACCINE_BY_LABEL } from "./vaccines";
import type { Guardian, Patient, Reminder, Visit } from "../types";

export interface Recipient {
  phone: string;
  kind: "patient" | "guardian";
}

type Desired = Omit<Reminder, "status" | "sentAt" | "createdAt" | "updatedAt">;

const isAdult = (p: Patient) => {
  const a = calculateAge(p.dob);
  return a.unit === "years" && a.value >= 18;
};

// Who would receive a text for this patient? Only someone who consented, on their own phone.
export function resolveRecipient(
  patient: Patient,
  guardian?: Guardian,
): Recipient | null {
  if (guardian?.smsConsent && guardian.phone)
    return { phone: guardian.phone, kind: "guardian" };
  if (isAdult(patient) && patient.smsConsent && patient.phone)
    return { phone: patient.phone, kind: "patient" };
  return null;
}

const dayText = (iso: string) =>
  fromISO(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// A date and nothing else: phones are shared, and messages are read by other people.
// The STOP line is a placeholder: a working stop handler must exist before anything is actually sent.
export function buildMessage(
  patient: Patient,
  kind: "patient" | "guardian",
  dueDate: string,
): string {
  const who =
    kind === "guardian"
      ? `${patient.fullName.split(" ")[0]}'s next clinic visit`
      : "Your next clinic visit";
  return `Reminder from ${config.facilityName}: ${who} is due on ${dayText(dueDate)}. Please bring the card. Reply STOP to opt out.`;
}

function make(
  p: Patient,
  to: Recipient,
  kind: Reminder["kind"],
  sourceId: string,
  title: string,
  dueDate: string,
  today: string,
): Desired {
  const dayBefore = addDays(dueDate, -1);
  return {
    id: `${kind}:${sourceId}:${dueDate}`,
    facilityId: config.facilityId,
    patientId: p.id,
    kind,
    sourceId,
    title,
    dueDate,
    sendOn: dayBefore < today ? today : dayBefore,
    phone: to.phone,
    recipient: to.kind,
    message: buildMessage(p, to.kind, dueDate),
  };
}

// "Who should be reminded right now?" Read-only, so it can be watched with liveQuery.
export async function computeDesired(today = todayISO()): Promise<Desired[]> {
  const patients = (await db.patients.toArray()).filter((p) => !p.deletedAt);
  const guardians = new Map(
    (await db.guardians.toArray())
      .filter((g) => !g.deletedAt)
      .map((g) => [g.id, g] as const),
  );
  const out: Desired[] = [];

  for (const p of patients) {
    const to = resolveRecipient(
      p,
      p.guardianId ? guardians.get(p.guardianId) : undefined,
    );
    if (!to) continue;

    // Follow-up visit: only the patient's latest visit counts
    const visits = (
      await db.visits.where("patientId").equals(p.id).toArray()
    ).filter((v) => !v.deletedAt);
    const latest = visits.reduce<Visit | null>(
      (best, v) =>
        !best ||
        v.visitDate > best.visitDate ||
        (v.visitDate === best.visitDate && v.createdAt > best.createdAt)
          ? v
          : best,
      null,
    );
    if (latest?.nextDueDate && latest.nextDueDate >= today) {
      out.push(
        make(
          p,
          to,
          "visit",
          latest.id,
          "Follow-up visit",
          latest.nextDueDate,
          today,
        ),
      );
    }

    // Next vaccine dose not given yet (children under 5)
    if (isUnder5(calculateAge(p.dob))) {
      const shots = (
        await db.immunizations.where("patientId").equals(p.id).toArray()
      ).filter((r) => !r.deletedAt);
      const given = new Set(
        shots.map((r) => `${r.vaccineName}|${r.doseNumber}`),
      );
      const queued = new Set<string>();
      for (const r of shots) {
        if (!r.nextDueDate || r.nextDueDate < today || !r.nextVaccineLabel)
          continue;
        const next = VACCINE_BY_LABEL.get(r.nextVaccineLabel);
        if (
          !next ||
          given.has(`${next.vaccineName}|${next.doseNumber}`) ||
          queued.has(next.key)
        )
          continue;
        queued.add(next.key);
        out.push(
          make(p, to, "vaccine", r.id, next.label, r.nextDueDate, today),
        );
      }
    }
  }
  return out;
}

// Brings the stored queue in line with what is wanted.
async function apply(desired: Desired[]) {
  const now = Date.now();
  const wanted = new Set(desired.map((d) => d.id));
  const changes = { count: 0 };

  await db.transaction("rw", db.reminders, db.syncQueue, async () => {
    const existing = new Map(
      (await db.reminders.toArray()).map((r) => [r.id, r] as const),
    );

    for (const d of desired) {
      const cur = existing.get(d.id);
      if (!cur) {
        await db.reminders.add({
          ...d,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        });
        changes.count++;
      } else if (cur.status !== "sent") {
        const same =
          cur.status === "pending" &&
          cur.title === d.title &&
          cur.sendOn === d.sendOn &&
          cur.phone === d.phone &&
          cur.recipient === d.recipient &&
          cur.message === d.message;
        if (!same) {
          await db.reminders.update(d.id, {
            title: d.title,
            sendOn: d.sendOn,
            phone: d.phone,
            recipient: d.recipient,
            message: d.message,
            status: "pending",
            updatedAt: now,
          });
          changes.count++;
        }
      }
    }

    for (const cur of existing.values()) {
      if (cur.status === "pending" && !wanted.has(cur.id)) {
        await db.reminders.update(cur.id, {
          status: "cancelled",
          updatedAt: now,
        });
        changes.count++;
      }
    }
  });

  if (changes.count > 0) void pushPending();
}

export function startReminderSync() {
  let latest: Desired[] | null = null;
  let busy = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = async () => {
    if (busy) return;
    busy = true;
    try {
      while (latest) {
        const next = latest;
        latest = null;
        await apply(next);
      }
    } catch (e) {
      console.warn("Reminder queue update failed", e);
    } finally {
      busy = false;
    }
  };

  const schedule = (desired: Desired[]) => {
    latest = desired;
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), 400);
  };

  // Re-runs whenever patients, guardians, visits or vaccines change (including changes pulled from other phones)
  liveQuery(() => computeDesired()).subscribe({
    next: schedule,
    error: (e) => console.warn("Reminder watcher stopped", e),
  });

  // Dates move on even when no data changes
  setInterval(() => void computeDesired().then(schedule), 3_600_000);
}
