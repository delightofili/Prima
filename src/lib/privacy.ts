import { db } from "../db";
import { logAudit } from "./audit";
import { config } from "./config";
import { pushPending } from "./syncService";
import type { Patient } from "../types";

// Drafts: have a lawyer or the facility's data protection officer review before real use.
export const NOTICE_VERSION = "draft-1";
export const ACK_VERSION = "draft-1";

export async function hasAcknowledged(userId: string) {
  const row = await db.meta.get("ack");
  try {
    const a = row
      ? (JSON.parse(row.value) as { userId: string; version: string })
      : null;
    return !!a && a.userId === userId && a.version === ACK_VERSION;
  } catch {
    return false;
  }
}

export async function acknowledge(userId: string) {
  await db.meta.put({
    key: "ack",
    value: JSON.stringify({ userId, version: ACK_VERSION, at: Date.now() }),
  });
  await logAudit("staff.acknowledge", "user", userId, ACK_VERSION);
}

export async function recordNotice(patientId: string) {
  const now = Date.now();
  await db.transaction("rw", db.patients, db.syncQueue, async () => {
    await db.patients.update(patientId, {
      noticeAt: now,
      noticeVersion: NOTICE_VERSION,
      updatedAt: now,
    });
  });
  void pushPending();
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// "Show me my record": everything held about one patient, in a readable machine format.
export async function exportPatientRecord(p: Patient) {
  const [visits, shots, guardian] = await Promise.all([
    db.visits
      .where("patientId")
      .equals(p.id)
      .filter((v) => !v.deletedAt)
      .toArray(),
    db.immunizations
      .where("patientId")
      .equals(p.id)
      .filter((r) => !r.deletedAt)
      .toArray(),
    p.guardianId ? db.guardians.get(p.guardianId) : Promise.resolve(undefined),
  ]);

  downloadJson(`prima-record-${p.cardNumber}.json`, {
    exportedAt: new Date().toISOString(),
    facility: config.facilityName,
    patient: {
      cardNumber: p.cardNumber,
      fullName: p.fullName,
      dateOfBirth: p.dob,
      gender: p.gender,
      phone: p.phone ?? null,
      village: p.village,
      lga: p.lga,
      state: p.state,
      nextOfKin: { name: p.nextOfKinName, phone: p.nextOfKinPhone },
      nhisNumber: p.nhisNumber ?? null,
      bloodGroup: p.bloodGroup ?? null,
      allergies: p.allergies ?? null,
      pregnant: p.isPregnant,
      gravida: p.gravida ?? null,
      para: p.para ?? null,
      reasonForFirstRegistration: p.initialChiefComplaint ?? null,
      registeredAt: new Date(p.createdAt).toISOString(),
    },
    consent: {
      privacyNoticeExplainedAt: p.noticeAt
        ? new Date(p.noticeAt).toISOString()
        : null,
      smsReminders: !!p.smsConsent,
    },
    guardian: guardian
      ? {
          name: guardian.fullName,
          relationship: guardian.relationship,
          phone: guardian.phone ?? null,
        }
      : null,
    visits: visits.map((v) => ({
      date: v.visitDate,
      complaints: v.complaints,
      bloodPressure:
        v.systolic !== undefined ? `${v.systolic}/${v.diastolic}` : null,
      temperatureC: v.temperature ?? null,
      weightKg: v.weightKg ?? null,
      diagnosis: v.diagnosisLabel ?? null,
      diagnosisCode: v.diagnosisCode ?? null,
      treatment: v.treatment ?? null,
      nextVisit: v.nextDueDate ?? null,
    })),
    vaccines: shots.map((s) => ({
      vaccine: s.vaccineName,
      dose: s.doseNumber,
      given: s.dateGiven,
      next: s.nextVaccineLabel ?? null,
      nextDue: s.nextDueDate ?? null,
    })),
  });

  await logAudit("record.export", "patient", p.id, `card ${p.cardNumber}`);
}
