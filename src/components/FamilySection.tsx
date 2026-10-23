import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { HeartPulse, Pencil, Plus, Users } from "lucide-react";
import { db } from "../db";
import { useGuardians } from "../hooks/useGuardians";
import { usePatients } from "../hooks/usePatients";
import { useToast } from "../hooks/useToast";
import { calculateAge } from "../lib/age";
import { detachGuardian, setGuardianOf } from "../lib/guardians";
import { formatDate } from "../lib/utils";
import type { Patient } from "../types";
import { GuardianCard } from "./GuardianCard";
import { GuardianDialog, GuardianEditDialog } from "./GuardianDialog";
import { isAncCode } from "../lib/serviceCodes";

export function FamilySection({ patient }: { patient: Patient }) {
  const toast = useToast();
  const { guardianMap, childrenOf } = useGuardians();
  const { patientMap } = usePatients("");
  const [dialog, setDialog] = useState<"change" | "edit" | null>(null);

  const guardian = patient.guardianId
    ? guardianMap.get(patient.guardianId)
    : undefined;
  const mother = guardian?.patientId
    ? patientMap.get(guardian.patientId)
    : undefined;

  const anc = useLiveQuery(async () => {
    if (!mother) return null;
    const rows = await db.visits
      .where("patientId")
      .equals(mother.id)
      .filter((v) => !v.deletedAt && isAncCode(v.diagnosisCode))
      .toArray();
    const latest = rows.reduce<string | null>(
      (best, v) => (best === null || v.visitDate > best ? v.visitDate : best),
      null,
    );
    return { count: rows.length, latest };
  }, [mother?.id]);

  const guardianRecords = useLiveQuery(
    () =>
      db.guardians
        .where("patientId")
        .equals(patient.id)
        .filter((g) => !g.deletedAt)
        .toArray(),
    [patient.id],
  );

  const children = useMemo(() => {
    const byId = new Map<string, Patient>();
    for (const g of guardianRecords ?? []) {
      for (const c of childrenOf.get(g.id) ?? [])
        if (c.id !== patient.id) byId.set(c.id, c);
    }
    return [...byId.values()];
  }, [guardianRecords, childrenOf, patient.id]);

  const age = calculateAge(patient.dob);
  const isMinor = age.unit === "months" || age.value < 18;
  if (!guardian && !isMinor && children.length === 0) return null;

  const remove = async () => {
    const previous = patient.guardianId;
    await detachGuardian(patient.id);
    toast("Guardian link removed", "ok", {
      label: "Undo",
      onClick: () => void setGuardianOf(patient.id, previous),
    });
  };

  return (
    <div className="space-y-5">
      {(guardian || isMinor) && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Users size={20} className="text-prima-500" /> Guardian
          </h2>

          {guardian ? (
            <GuardianCard
              guardian={guardian}
              kids={childrenOf.get(guardian.id) ?? []}
              footer={
                <div className="space-y-3">
                  {mother && (
                    <div className="space-y-1 rounded-xl bg-prima-50 p-3">
                      <Link
                        to={`/patients/${mother.id}`}
                        className="font-semibold text-prima-900 underline"
                      >
                        Mother's record: {mother.fullName} · {mother.cardNumber}
                      </Link>
                      {anc && anc.count > 0 && anc.latest ? (
                        <p className="flex items-center gap-2 text-sm">
                          <HeartPulse size={16} /> Antenatal visits: {anc.count}
                          , latest {formatDate(anc.latest)}
                        </p>
                      ) : (
                        <p className="text-sm text-subtext">
                          No antenatal visits recorded for her yet.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="btn btn-secondary sm:w-48"
                      onClick={() => setDialog("change")}
                    >
                      Change guardian
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary sm:w-48"
                      onClick={() => setDialog("edit")}
                    >
                      <Pencil size={18} className="mr-2" /> Edit details
                    </button>
                    <button
                      type="button"
                      className="min-h-12 px-3 font-semibold text-danger"
                      onClick={remove}
                    >
                      Remove link
                    </button>
                  </div>
                </div>
              }
            />
          ) : (
            <div className="card space-y-2 text-center">
              <p className="font-semibold">No guardian linked</p>
              <p className="text-subtext">
                Link a guardian so reminders and calls reach the right person.
              </p>
              <button
                type="button"
                className="btn btn-accent mx-auto sm:w-56"
                onClick={() => setDialog("change")}
              >
                <Plus size={20} className="mr-2" /> Add guardian
              </button>
            </div>
          )}
        </section>
      )}

      {children.length > 0 && (
        <section className="card space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Users size={20} className="text-prima-500" /> Children (
            {children.length})
          </h2>
          <ul className="divide-y divide-line">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/patients/${c.id}`}
                  className="flex min-h-12 items-center justify-between gap-3 py-2"
                >
                  <span className="font-semibold">{c.fullName}</span>
                  <span className="text-subtext">
                    {calculateAge(c.dob).label} · {c.cardNumber}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dialog === "change" && (
        <GuardianDialog patient={patient} onClose={() => setDialog(null)} />
      )}
      {dialog === "edit" && guardian && (
        <GuardianEditDialog
          guardian={guardian}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
