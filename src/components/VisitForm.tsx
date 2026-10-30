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
import { useI18n, type Key } from "../i18n";

const QUICK: { key: Key; days: number }[] = [
  { key: "visit.in3days", days: 3 },
  { key: "visit.in1week", days: 7 },
  { key: "visit.in2weeks", days: 14 },
  { key: "visit.in1month", days: 30 },
];

export function VisitForm({
  patient,
  visit,
}: {
  patient: Patient;
  visit?: Visit;
}) {
  const { t, tv } = useI18n();
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
          // This is written into the record, so it stays English like every other note in the record
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
      toast(t(visit ? "visit.updated" : "visit.saved"));
      navigate(`/patients/${patient.id}`);
    } catch (e) {
      console.error(e);
      setSaveError(t("visit.saveFailed"));
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-5 pb-24 md:grid-cols-2 md:pb-0"
    >
      <section className="card space-y-4 md:col-span-2">
        <SectionTitle icon={ClipboardList} title={t("visit.title")} />
        <Field label={t("visit.date")} error={tv(errors.visitDate?.message)}>
          <input
            type="date"
            className="input md:max-w-xs"
            max={todayISO()}
            {...register("visitDate")}
          />
        </Field>
        <Field
          label={t("visit.complaints")}
          error={tv(errors.complaints?.message)}
          hint={
            !visit && patient.initialChiefComplaint
              ? t("visit.prefilled")
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
        <SectionTitle icon={Activity} title={t("visit.vitals")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="systolic"
            render={({ field }) => (
              <Stepper
                label={t("visit.bpTop")}
                unit="mmHg"
                inputMode="numeric"
                min={50}
                max={300}
                step={1}
                start={120}
                decimals={0}
                value={field.value}
                onChange={field.onChange}
                error={tv(errors.systolic?.message)}
              />
            )}
          />
          <Controller
            control={control}
            name="diastolic"
            render={({ field }) => (
              <Stepper
                label={t("visit.bpBottom")}
                unit="mmHg"
                inputMode="numeric"
                min={30}
                max={200}
                step={1}
                start={80}
                decimals={0}
                value={field.value}
                onChange={field.onChange}
                error={tv(errors.diastolic?.message)}
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
                label={t("visit.temperature")}
                unit="°C"
                min={30}
                max={45}
                step={0.1}
                start={36.8}
                decimals={1}
                value={field.value}
                onChange={field.onChange}
                error={tv(errors.temperature?.message)}
              />
            )}
          />
          <Controller
            control={control}
            name="weightKg"
            render={({ field }) => (
              <Stepper
                label={t("visit.weight")}
                unit="kg"
                min={0.5}
                max={300}
                step={0.1}
                start={weightStart}
                decimals={1}
                value={field.value}
                onChange={field.onChange}
                error={tv(errors.weightKg?.message)}
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
          {t("visit.flagsNote")}
        </p>
      </section>

      <section className="card space-y-4">
        <SectionTitle icon={Stethoscope} title={t("visit.assessment")} />
        <div className="space-y-1">
          <span className="text-base font-semibold">
            {t("visit.diagnosis")}
          </span>
          <DiagnosisPicker value={diagnosis} onChange={setDiagnosis} />
        </div>
        <Field
          label={t("visit.treatment")}
          error={tv(errors.treatment?.message)}
        >
          <textarea
            rows={3}
            className="input h-auto py-2"
            placeholder={t("visit.treatmentExample")}
            {...register("treatment")}
          />
        </Field>
      </section>

      <section className="card space-y-4 md:col-span-2">
        <SectionTitle icon={CalendarClock} title={t("visit.followUpTitle")} />
        <Field
          label={t("visit.nextDate")}
          error={tv(errors.nextDueDate?.message)}
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
              key={q.key}
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
              {t(q.key)}
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
        note={isDirty ? t("register.unsaved") : undefined}
      >
        <Link
          to={`/patients/${patient.id}`}
          className="btn btn-secondary"
          onClick={(e) => {
            if (
              isDirty &&
              !isSubmitSuccessful &&
              !window.confirm(t("visit.leaveConfirm"))
            )
              e.preventDefault();
          }}
        >
          {t("common.cancel")}
        </Link>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          <Save size={20} className="mr-2" />
          {isSubmitting ? t("register.saving") : t("visit.save")}
        </button>
      </StickyActions>
    </form>
  );
}
