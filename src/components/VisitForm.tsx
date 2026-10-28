import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
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
import { addDays, fromISO, todayISO } from "../lib/utils";
import type { Patient, Visit } from "../types";
import { DiagnosisPicker } from "./DiagnosisPicker";
import { Field, SectionTitle } from "./FormBits";
import { useToast } from "../hooks/useToast";
import { VitalChip } from "./VitalChip";

import { ComplaintHint } from "./ComplaintHint";
import { Stepper } from "./Stepper";
import { StickyActions } from "./StickyActions";
import { useUnsavedWarning } from "../hooks/useUnsavedWarning";

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
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
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
  const complaintsText = useWatch({ control, name: "complaints" }) ?? "";
  // Where the first tap on the weight stepper begins, by age. It is a starting point, never a saved value.
  const weightStart =
    age.unit !== "years" ? 6 : age.value < 5 ? 12 : age.value < 13 ? 30 : 60;
  useUnsavedWarning(isDirty && !isSubmitSuccessful);
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
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-5 pb-24 md:grid-cols-2 md:pb-0"
    >
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
        <ComplaintHint
          value={complaintsText}
          onReplace={(v) =>
            setValue("complaints", v, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </section>

      <section className="card space-y-4">
        <SectionTitle icon={Activity} title="Vitals" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="systolic"
            render={({ field }) => (
              <Stepper
                label="BP top number (systolic)"
                unit="mmHg"
                inputMode="numeric"
                min={50}
                max={300}
                step={1}
                start={120}
                decimals={0}
                value={field.value}
                onChange={field.onChange}
                error={errors.systolic?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="diastolic"
            render={({ field }) => (
              <Stepper
                label="BP bottom number (diastolic)"
                unit="mmHg"
                inputMode="numeric"
                min={30}
                max={200}
                step={1}
                start={80}
                decimals={0}
                value={field.value}
                onChange={field.onChange}
                error={errors.diastolic?.message}
              />
            )}
          />
        </div>
        {bp?.note && (
          <VitalChip
            icon={Activity}
            text={`${sys}/${dia} mmHg`}
            flag={bp.flag}
            note={bp.note}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="temperature"
            render={({ field }) => (
              <Stepper
                label="Temperature"
                unit="°C"
                min={30}
                max={45}
                step={0.1}
                start={36.8}
                decimals={1}
                value={field.value}
                onChange={field.onChange}
                error={errors.temperature?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="weightKg"
            render={({ field }) => (
              <Stepper
                label="Weight"
                unit="kg"
                min={0.5}
                max={300}
                step={0.1}
                start={weightStart}
                decimals={1}
                value={field.value}
                onChange={field.onChange}
                error={errors.weightKg?.message}
              />
            )}
          />
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

      <StickyActions
        className="md:col-span-2"
        note={isDirty ? "Unsaved changes" : undefined}
      >
        <Link
          to={`/patients/${patient.id}`}
          className="btn btn-secondary"
          onClick={(e) => {
            if (
              isDirty &&
              !isSubmitSuccessful &&
              !window.confirm("Leave without saving this visit?")
            )
              e.preventDefault();
          }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          <Save size={20} className="mr-2" />
          {isSubmitting ? "Saving…" : "Save visit"}
        </button>
      </StickyActions>
    </form>
  );
}
