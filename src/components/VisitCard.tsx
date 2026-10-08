import {
  Activity,
  Calendar,
  CalendarClock,
  Pill,
  Thermometer,
  Weight,
} from "lucide-react";
import { calculateAge } from "../lib/age";
import { tempReading, bpReading } from "../lib/vitals";
import { formatDate, fromISO, todayISO } from "../lib/utils";
import type { Visit } from "../types";
import { VitalChip } from "./VitalChip";

export function VisitCard({ v, dob }: { v: Visit; dob: string }) {
  const age = calculateAge(dob, fromISO(v.visitDate));
  const adult = age.unit === "years" && age.value >= 13;
  const bp =
    v.systolic !== undefined && v.diastolic !== undefined
      ? bpReading(v.systolic, v.diastolic)
      : null;
  const tr = v.temperature !== undefined ? tempReading(v.temperature) : null;
  const overdue = !!v.nextDueDate && v.nextDueDate < todayISO();

  return (
    <article className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-bold">
          <Calendar size={18} className="text-prima-500" />{" "}
          {formatDate(v.visitDate)}
        </p>
        {v.diagnosisLabel && (
          <span className="rounded-full bg-prima-50 px-3 py-1 text-sm font-semibold text-prima-900">
            {v.diagnosisLabel}
            {v.diagnosisCode && (
              <span className="ml-2 font-mono text-xs">{v.diagnosisCode}</span>
            )}
          </span>
        )}
      </div>

      <p>{v.complaints}</p>

      {(bp || tr || v.weightKg !== undefined) && (
        <div className="flex flex-wrap gap-2">
          {bp && (
            <VitalChip
              icon={Activity}
              text={`${v.systolic}/${v.diastolic} mmHg`}
              flag={adult ? bp.flag : "normal"}
              note={adult ? bp.note : undefined}
            />
          )}
          {tr && (
            <VitalChip
              icon={Thermometer}
              text={`${v.temperature}°C`}
              flag={tr.flag}
              note={tr.note}
            />
          )}
          {v.weightKg !== undefined && (
            <VitalChip icon={Weight} text={`${v.weightKg} kg`} />
          )}
        </div>
      )}

      {v.treatment && (
        <p className="flex items-start gap-2 text-subtext">
          <Pill size={18} className="mt-0.5 shrink-0" /> {v.treatment}
        </p>
      )}

      {v.nextDueDate && (
        <p
          className={`flex items-center gap-2 font-semibold ${overdue ? "text-danger" : "text-prima-900"}`}
        >
          <CalendarClock size={18} /> Follow-up {formatDate(v.nextDueDate)}
          {overdue && " (overdue)"}
        </p>
      )}
    </article>
  );
}
