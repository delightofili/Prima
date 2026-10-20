import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Save,
  Stethoscope,
  Thermometer,
  Weight,
} from "lucide-react";
import { calculateAge } from "../lib/age";
import { makeVisitSchema, type VisitFormValues } from "../lib/visitSchema";
import { saveVisit, updateVisit, type Diagnosis } from "../lib/visits";
import { bpReading, tempReading } from "../lib/vitals";
import { addDays, fromISO, toNumber, todayISO } from "../lib/utils";
import type { Patient, Visit } from "../types";
import { DiagnosisPicker } from "./DiagnosisPicker";
import { Field, SectionTitle } from "./FormBits";
import { useToast } from "../hooks/useToast";
import { VitalChip } from "./VitalChip";

const QUICK = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

export function VisitForm({
  patient,
  visit,
}: {
  patient: Patient;
  visit?: Visit;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const schema = useMemo(() => makeVisitSchema(patient.dob), [patient.dob]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: visit
      ? {
          visitDate: visit.visitDate,
          complaints: visit.complaints,
          systolic: visit.systolic,
          diastolic: visit.diastolic,
          temperature: visit.temperature,
          weightKg: visit.weightKg,
          treatment: visit.treatment ?? "",
          nextDueDate: visit.nextDueDate ?? "",
        }
      : {
          visitDate: todayISO(),
          complaints: patient.initialChiefComplaint
            ? `Follow-up for: ${patient.initialChiefComplaint}`
            : "",
        },
  });

  const [diagnosis, setDiagnosis] = useState<Diagnosis>(
    visit
      ? { code: visit.diagnosisCode, label: visit.diagnosisLabel ?? "" }
      : { label: "" },
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const visitDate = useWatch({ control, name: "visitDate" });
  const sys = useWatch({ control, name: "systolic" });
  const dia = useWatch({ control, name: "diastolic" });
  const temp = useWatch({ control, name: "temperature" });

  const age = calculateAge(patient.dob, fromISO(visitDate || todayISO()));
  const adult = age.unit === "years" && age.value >= 13;

  const bp =
    adult && Number.isFinite(sys) && Number.isFinite(dia)
      ? bpReading(sys!, dia!)
      : null;
  const tr =
    temp !== undefined && Number.isFinite(temp) ? tempReading(temp) : null;

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      if (visit) await updateVisit(visit, values, diagnosis);
      else await saveVisit(patient, values, diagnosis);
      toast(visit ? "Visit updated" : "Visit saved");
      navigate(`/patients/${patient.id}`);
    } catch (e) {
      console.error(e);
      setSaveError("Could not save this visit. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 md:grid-cols-2">
      <section className="card space-y-4 md:col-span-2">
        <SectionTitle icon={ClipboardList} title="Visit" />
        <Field label="Visit date" error={errors.visitDate?.message}>
          <input
            type="date"
            className="input md:max-w-xs"
            max={todayISO()}
            {...register("visitDate")}
          />
        </Field>
        <Field
          label="Complaints"
          error={errors.complaints?.message}
          hint={
            !visit && patient.initialChiefComplaint
              ? "Pre-filled from first registration. Edit as needed."
              : undefined
          }
        >
          <textarea
            rows={3}
            maxLength={500}
            className="input h-auto py-2"
            {...register("complaints")}
          />
        </Field>
      </section>

      <section className="card space-y-4">
        <SectionTitle icon={Activity} title="Vitals" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="BP systolic" error={errors.systolic?.message}>
            <input
              inputMode="numeric"
              className="input"
              placeholder="120"
              {...register("systolic", { setValueAs: toNumber })}
            />
          </Field>
          <Field label="BP diastolic" error={errors.diastolic?.message}>
            <input
              inputMode="numeric"
              className="input"
              placeholder="80"
              {...register("diastolic", { setValueAs: toNumber })}
            />
          </Field>
        </div>
        {bp?.note && (
          <VitalChip
            icon={Activity}
            text={`${sys}/${dia} mmHg`}
            flag={bp.flag}
            note={bp.note}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Temperature (°C)" error={errors.temperature?.message}>
            <input
              inputMode="decimal"
              className="input"
              placeholder="36.8"
              {...register("temperature", { setValueAs: toNumber })}
            />
          </Field>
          <Field label="Weight (kg)" error={errors.weightKg?.message}>
            <input
              inputMode="decimal"
              className="input"
              placeholder="62"
              {...register("weightKg", { setValueAs: toNumber })}
            />
          </Field>
        </div>
        {tr?.note && (
          <VitalChip
            icon={Thermometer}
            text={`${temp}°C`}
            flag={tr.flag}
            note={tr.note}
          />
        )}

        <p className="flex items-start gap-2 text-sm text-subtext">
          <Weight size={16} className="mt-0.5 shrink-0" />
          Flags are a guide, not a diagnosis. BP flags apply to patients 13 and
          over.
        </p>
      </section>

      <section className="card space-y-4">
        <SectionTitle icon={Stethoscope} title="Assessment" />
        <div className="space-y-1">
          <span className="text-base font-semibold">Diagnosis (optional)</span>
          <DiagnosisPicker value={diagnosis} onChange={setDiagnosis} />
        </div>
        <Field
          label="Treatment / notes (optional)"
          error={errors.treatment?.message}
        >
          <textarea
            rows={3}
            className="input h-auto py-2"
            placeholder="e.g. Artemether-lumefantrine, advised fluids"
            {...register("treatment")}
          />
        </Field>
      </section>

      <section className="card space-y-4 md:col-span-2">
        <SectionTitle icon={CalendarClock} title="Follow-up" />
        <Field
          label="Next visit date (optional)"
          error={errors.nextDueDate?.message}
        >
          <input
            type="date"
            className="input md:max-w-xs"
            min={visitDate}
            {...register("nextDueDate")}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              className="min-h-11 rounded-full border-2 border-prima-500 px-4 text-sm font-semibold text-prima-500 hover:bg-prima-50"
              onClick={() =>
                setValue(
                  "nextDueDate",
                  addDays(visitDate || todayISO(), q.days),
                  { shouldValidate: true },
                )
              }
            >
              In {q.label}
            </button>
          ))}
        </div>
      </section>

      {saveError && (
        <p role="alert" className="font-medium text-danger md:col-span-2">
          {saveError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 md:col-span-2 md:flex-row md:justify-end">
        <Link
          to={`/patients/${patient.id}`}
          className="btn btn-secondary md:w-40"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="btn btn-primary md:w-56"
          disabled={isSubmitting}
        >
          <Save size={20} className="mr-2" />
          {isSubmitting ? "Saving…" : visit ? "Save changes" : "Save visit"}
        </button>
      </div>
    </form>
  );
}
