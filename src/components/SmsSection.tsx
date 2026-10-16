import type { ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { MessageSquare } from "lucide-react";
import { db } from "../db";
import { useGuardians } from "../hooks/useGuardians";
import { useToast } from "../hooks/useToast";
import { calculateAge } from "../lib/age";
import { setGuardianSmsConsent, setPatientSmsConsent } from "../lib/consent";
import { formatDate, formatPhone } from "../lib/utils";
import type { Patient } from "../types";
import { SmsConsentToggle } from "./SmsConsent";

export function SmsSection({ patient }: { patient: Patient }) {
  const toast = useToast();
  const { guardianMap } = useGuardians();
  const guardian = patient.guardianId
    ? guardianMap.get(patient.guardianId)
    : undefined;

  const upcoming = useLiveQuery(async () => {
    const rows = await db.reminders
      .where("patientId")
      .equals(patient.id)
      .toArray();
    return rows
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.sendOn.localeCompare(b.sendOn))
      .slice(0, 3);
  }, [patient.id]);

  const age = calculateAge(patient.dob);
  const adult = age.unit === "years" && age.value >= 18;

  let body: ReactNode;
  if (guardian) {
    body = (
      <SmsConsentToggle
        who={guardian.fullName}
        phone={formatPhone(guardian.phone) ?? ""}
        consented={!!guardian.smsConsent}
        since={guardian.smsConsentAt}
        disabled={!guardian.phone}
        note={
          guardian.phone
            ? `Reminders go to ${guardian.fullName} (${formatPhone(guardian.phone)}), for every child linked to them.`
            : "This guardian has no phone number."
        }
        onChange={async (on) => {
          await setGuardianSmsConsent(guardian.id, on);
          toast(
            on ? "SMS reminders switched on" : "SMS reminders switched off",
          );
        }}
      />
    );
  } else if (adult && patient.phone) {
    body = (
      <SmsConsentToggle
        who={patient.fullName}
        phone={formatPhone(patient.phone) ?? ""}
        consented={!!patient.smsConsent}
        since={patient.smsConsentAt}
        note={`Reminders go to ${formatPhone(patient.phone)}.`}
        onChange={async (on) => {
          await setPatientSmsConsent(patient.id, on);
          toast(
            on ? "SMS reminders switched on" : "SMS reminders switched off",
          );
        }}
      />
    );
  } else {
    body = (
      <p className="text-subtext">
        {adult
          ? "Add a phone number to this patient to send reminders."
          : "Add a guardian with a phone number to send reminders for this child."}
      </p>
    );
  }

  return (
    <section className="card space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <MessageSquare size={20} className="text-prima-500" /> SMS reminders
      </h2>
      {body}

      {upcoming && upcoming.length > 0 && (
        <div className="space-y-2 border-t border-line pt-3">
          <p className="font-semibold">Queued for this patient</p>
          {upcoming.map((r) => (
            <div key={r.id} className="rounded-xl bg-page p-3 text-sm">
              <p className="font-semibold">
                Sends {formatDate(r.sendOn)} · visit on {formatDate(r.dueDate)}
              </p>
              <p className="mt-1 text-subtext">{r.message}</p>
            </div>
          ))}
          <p className="text-sm text-subtext">
            Sending is not switched on yet.
          </p>
        </div>
      )}
    </section>
  );
}
