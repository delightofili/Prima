import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../db";
import { config } from "../lib/config";
import { calculateAge, isUnder5, isWomanOver12 } from "../lib/age";
import { Users } from "lucide-react";
import { GuardianPicker } from "./GuardianPicker";
import { validateGuardianChoice, type GuardianChoice } from "../lib/guardians";
import {
  findExactDuplicate,
  registerPatient,
  updatePatient,
  valuesFromPatient,
} from "../lib/patients";
import { findSimilar } from "../lib/fuzzy";
import { PlanLimitError } from "../lib/plan";
import {
  patientFormSchema,
  validateImmunizations,
  type PatientFormValues,
} from "../lib/schema";
import { normalize, todayISO } from "../lib/utils";
import { BLOOD_GROUPS, type Patient } from "../types";
import { useDebounce } from "../hooks/common";
import { ImmunizationChecklist } from "./ImmunizationChecklist";
import { toE164 } from "../lib/utils";
import { useUnsavedWarning } from "../hooks/useUnsavedWarning";
import { ComplaintHint } from "./ComplaintHint";
import { StickyActions } from "./StickyActions";
import { Link } from "react-router-dom";

type Hint =
  | { kind: "exact"; patient: Patient }
  | { kind: "similar"; items: { patient: Patient; score: number }[] }
  | null;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-base font-semibold">{label}</span>
      {children}
      {error && (
        <span role="alert" className="block text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export function PatientForm({
  onSaved,
  patient,
}: {
  onSaved: (p: Patient) => void;
  patient?: Patient;
}) {
  const editing = !!patient;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: patient
      ? valuesFromPatient(patient)
      : {
          isNewAdmission: false,
          isPregnant: false,
          lga: config.facilityLga,
          state: config.facilityState,
          smsConsent: false,
          noticeGiven: false,
        },
  });

  useUnsavedWarning(isDirty && !isSubmitSuccessful);

  const [picked, setPicked] = useState<Record<string, string>>({});
  const [hint, setHint] = useState<Hint>(null);
  const [guardian, setGuardian] = useState<GuardianChoice>({ kind: "none" });
  const [guardianError, setGuardianError] = useState<string | null>(null);
  const [confirmedForKey, setConfirmedForKey] = useState<string | null>(null);
  const [vaccineError, setVaccineError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isNewAdmission = useWatch({ control, name: "isNewAdmission" });
  const complaint = useWatch({ control, name: "initialChiefComplaint" }) ?? "";
  const gender = useWatch({ control, name: "gender" });
  const dob = useWatch({ control, name: "dob" });
  const fullName = useWatch({ control, name: "fullName" });
  const village = useWatch({ control, name: "village" });
  const nokName = useWatch({ control, name: "nextOfKinName" }) ?? "";
  const nokPhone = useWatch({ control, name: "nextOfKinPhone" }) ?? "";
  const phoneValue = useWatch({ control, name: "phone" });

  const validDob =
    !!dob && /^\d{4}-\d{2}-\d{2}$/.test(dob) && dob <= todayISO();
  const age = validDob ? calculateAge(dob) : null;
  const showObstetric = !!age && !!gender && isWomanOver12(gender, age);
  const showVaccines = !editing && !!age && isUnder5(age);
  const showGuardian =
    !editing && !!age && (age.unit === "months" || age.value < 18);

  const adult = !!age && age.unit === "years" && age.value >= 18;
  const showSms = adult && !!toE164(phoneValue ?? "");

  useEffect(() => {
    if (!showObstetric) {
      setValue("para", undefined);
      setValue("gravida", undefined);
      setValue("isPregnant", false);
    }
  }, [showObstetric, setValue]);
  useEffect(() => {
    if (!showSms) setValue("smsConsent", false);
  }, [showSms, setValue]);

  const dobRegistration = register("dob");
  const handleDobChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    void dobRegistration.onChange(event);
    const nextValidDob =
      /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= todayISO();
    const nextAge = nextValidDob ? calculateAge(value) : null;
    const nextShowVaccines = !editing && !!nextAge && isUnder5(nextAge);
    const nextShowGuardian =
      !editing &&
      !!nextAge &&
      (nextAge.unit === "months" || nextAge.value < 18);

    if (showVaccines && !nextShowVaccines) setPicked({});
    if (showGuardian && !nextShowGuardian) setGuardian({ kind: "none" });
  };

  // Live duplicate warning: runs 250 ms after the nurse stops typing
  const key = useDebounce(
    JSON.stringify([fullName ?? "", dob ?? "", village ?? ""]),
    250,
  );
  const confirmed = confirmedForKey === key;
  useEffect(() => {
    let cancelled = false;
    const [n, d, v] = JSON.parse(key) as [string, string, string];
    findExactDuplicate(n, d, v, patient?.id).then((p) => {
      if (!cancelled) setHint(p ? { kind: "exact", patient: p } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [key, patient?.id]);

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);

    const vErr = showVaccines
      ? validateImmunizations(values.dob, picked)
      : null;

    setVaccineError(vErr);
    if (vErr) return;
    const gErr = showGuardian ? validateGuardianChoice(guardian) : null;
    setGuardianError(gErr);
    if (gErr) return;
    if (!confirmed) {
      const exact = await findExactDuplicate(
        values.fullName,
        values.dob,
        values.village,
        patient?.id,
      );
      if (exact) {
        setHint({ kind: "exact", patient: exact });
        return;
      }
      const sameDob = (
        await db.patients.where("dob").equals(values.dob).toArray()
      ).filter((p) => !p.deletedAt && p.id !== patient?.id);
      const byId = new Map(sameDob.map((p) => [p.id, p] as const));
      const matches = await findSimilar(
        normalize(values.fullName),
        sameDob.map((p) => ({ id: p.id, name: p.name })),
      );
      const items = matches.flatMap((m) => {
        const patient = byId.get(m.id);
        return patient ? [{ patient, score: m.score }] : [];
      });
      if (items.length) {
        setHint({ kind: "similar", items });
        return;
      }
    }

    try {
      if (editing && patient) {
        values.dobEstimated =
          values.dob === patient.dob ? !!patient.dobEstimated : false;
      }
      const saved = editing
        ? await updatePatient(patient!, values)
        : await registerPatient(
            values,
            showVaccines ? picked : {},
            showGuardian ? guardian : { kind: "none" },
          );
      onSaved(saved);
    } catch (e) {
      if (e instanceof PlanLimitError) {
        setSaveError(`${e.message} Upgrade to Basic to add more patients.`);
        return;
      }
      console.error(e);
      setSaveError("Could not save this patient. Please try again.");
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 pb-24 md:pb-0 md:grid-cols-2"
      noValidate
    >
      {/* 1. NEW ADMISSION */}
      <section className="card space-y-3 md:col-span-2">
        <label className="flex min-h-12 items-center justify-between gap-3 text-base font-semibold">
          New admission? (first visit for a complaint)
          <input
            type="checkbox"
            className="size-7 accent-prima-500"
            {...register("isNewAdmission")}
          />
        </label>
        {isNewAdmission && (
          <Field
            label="Chief complaint"
            error={errors.initialChiefComplaint?.message}
          >
            <textarea
              rows={3}
              maxLength={200}
              className="input h-auto py-2"
              placeholder="e.g. fever and cough for 3 days"
              {...register("initialChiefComplaint")}
            />
            <ComplaintHint
              value={complaint}
              onReplace={(v) =>
                setValue("initialChiefComplaint", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <span className="block text-right text-sm text-subtext">
              {complaint.length}/200
            </span>
          </Field>
        )}
      </section>

      {/* 2. PATIENT */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Patient</h2>
        <Field label="Full name" error={errors.fullName?.message}>
          <input
            className="input"
            autoComplete="off"
            {...register("fullName")}
          />
        </Field>
        <Field label="Date of birth" error={errors.dob?.message}>
          <input
            type="date"
            className="input"
            max={todayISO()}
            {...dobRegistration}
            onChange={handleDobChange}
          />
          {age && <span className="block text-subtext">Age: {age.label}</span>}
        </Field>
        <div className="space-y-1">
          <span className="text-base font-semibold">Gender</span>
          <div className="grid grid-cols-2 gap-3">
            {(["FEMALE", "MALE"] as const).map((g) => (
              <label key={g}>
                <input
                  type="radio"
                  value={g}
                  className="peer sr-only"
                  {...register("gender")}
                />
                <span className="flex h-12 items-center justify-center rounded-xl border-2 border-line bg-white text-base font-semibold peer-checked:border-prima-500 peer-checked:bg-prima-50 peer-focus-visible:ring-2 peer-focus-visible:ring-prima-500">
                  {g === "FEMALE" ? "Female" : "Male"}
                </span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <span
              role="alert"
              className="block text-sm font-medium text-danger"
            >
              {errors.gender.message}
            </span>
          )}
        </div>
        <Field label="Phone (optional)" error={errors.phone?.message}>
          <input
            type="tel"
            inputMode="numeric"
            className="input"
            placeholder="08031234567"
            {...register("phone")}
          />
        </Field>
        {showSms && (
          <label className="flex min-h-12 items-start gap-3 rounded-xl bg-page p-3">
            <input
              type="checkbox"
              className="mt-1 size-6 accent-prima-500"
              {...register("smsConsent")}
            />
            <span>
              <span className="block font-semibold">
                Send appointment reminders by SMS
              </span>
              <span className="block text-sm text-subtext">
                The patient agrees to receive reminders on this number. Messages
                never include health details.
              </span>
              {errors.smsConsent && (
                <span
                  role="alert"
                  className="block text-sm font-medium text-danger"
                >
                  {errors.smsConsent.message}
                </span>
              )}
            </span>
          </label>
        )}
      </section>

      {/* 3. ADDRESS */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Address</h2>
        <Field label="Village / Town" error={errors.village?.message}>
          <input
            className="input"
            autoComplete="off"
            {...register("village")}
          />
        </Field>
        <Field label="LGA" error={errors.lga?.message}>
          <input className="input" {...register("lga")} />
        </Field>
        <Field label="State" error={errors.state?.message}>
          <input className="input" {...register("state")} />
        </Field>
      </section>

      {/* 4. NEXT OF KIN */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Next of kin</h2>
        <Field label="Name" error={errors.nextOfKinName?.message}>
          <input className="input" {...register("nextOfKinName")} />
        </Field>
        <Field label="Phone" error={errors.nextOfKinPhone?.message}>
          <input
            type="tel"
            inputMode="numeric"
            className="input"
            placeholder="08051234567"
            {...register("nextOfKinPhone")}
          />
        </Field>
      </section>

      {/* 5. OPTIONAL MEDICAL */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Medical (optional)</h2>
        <Field label="NHIS number" error={errors.nhisNumber?.message}>
          <input className="input" {...register("nhisNumber")} />
        </Field>
        <Field label="Blood group" error={errors.bloodGroup?.message}>
          <select className="input" {...register("bloodGroup")}>
            <option value="">Not known</option>
            {BLOOD_GROUPS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Known allergies" error={errors.allergies?.message}>
          <textarea
            rows={2}
            className="input h-auto py-2"
            placeholder="e.g. Penicillin"
            {...register("allergies")}
          />
        </Field>
      </section>

      {/* 6. WOMEN OVER 12 ONLY */}
      {showObstetric && (
        <section className="space-y-4 rounded-2xl border-2 border-prima-500/30 bg-prima-50 p-4 md:col-span-2">
          <h2 className="text-lg font-bold">Obstetric history</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gravida" error={errors.gravida?.message}>
              <input
                inputMode="numeric"
                className="input"
                {...register("gravida", {
                  setValueAs: (v) =>
                    v === "" || v == null ? undefined : Number(v),
                })}
              />
            </Field>
            <Field label="Para" error={errors.para?.message}>
              <input
                inputMode="numeric"
                className="input"
                {...register("para", {
                  setValueAs: (v) =>
                    v === "" || v == null ? undefined : Number(v),
                })}
              />
            </Field>
          </div>
          <label className="flex min-h-12 items-center gap-3 text-base font-semibold">
            <input
              type="checkbox"
              className="size-7 accent-prima-500"
              {...register("isPregnant")}
            />
            Currently pregnant
          </label>
          {errors.isPregnant && (
            <span
              role="alert"
              className="block text-sm font-medium text-danger"
            >
              {errors.isPregnant.message}
            </span>
          )}
        </section>
      )}

      {/* 7. CHILDREN UNDER 5 ONLY */}
      {showVaccines && (
        <div className="md:col-span-2">
          <ImmunizationChecklist value={picked} onChange={setPicked} />
        </div>
      )}
      {vaccineError && (
        <p role="alert" className="font-medium text-danger md:col-span-2">
          {vaccineError}
        </p>
      )}
      {showGuardian && (
        <section className="card space-y-3 md:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Users size={20} className="text-prima-500" /> Guardian (optional)
          </h2>
          <p className="text-subtext">
            Adding a guardian lets Prima call the right person for vaccines and
            follow-ups. Search first: a mother with several children is one
            guardian.
          </p>
          <GuardianPicker
            value={guardian}
            onChange={setGuardian}
            nextOfKin={{ name: nokName, phone: nokPhone }}
          />
          {guardianError && (
            <p role="alert" className="font-medium text-danger">
              {guardianError}
            </p>
          )}
        </section>
      )}

      {!editing && (
        <label className="flex min-h-12 items-start gap-3 rounded-2xl border-2 border-line bg-white p-4 md:col-span-2">
          <input
            type="checkbox"
            className="mt-1 size-6 accent-prima-500"
            {...register("noticeGiven")}
          />
          <span>
            <span className="block font-semibold">
              Privacy notice explained
            </span>
            <span className="block text-sm text-subtext">
              I told the patient (or their guardian) how their information is
              used, and that they can ask to see, correct or remove it. If this
              was not possible now, leave it unticked and record it later from
              the profile.
            </span>
          </span>
        </label>
      )}

      {/* DUPLICATE WARNING */}
      {hint && (
        <div
          role="alert"
          className="space-y-2 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4 md:col-span-2"
        >
          {hint.kind === "exact" ? (
            <p className="font-semibold">
              Already registered? {hint.patient.fullName} (
              {hint.patient.cardNumber}) has the same name, date of birth and
              village.
            </p>
          ) : (
            <>
              <p className="font-semibold">
                Similar names with the same date of birth:
              </p>
              <ul className="list-disc pl-5">
                {hint.items.map((i) => (
                  <li key={i.patient.id}>
                    {i.patient.fullName} · {i.patient.cardNumber} ·{" "}
                    {Math.round(i.score)}% match
                  </li>
                ))}
              </ul>
            </>
          )}
          <label className="flex min-h-12 items-center gap-3 font-medium">
            <input
              type="checkbox"
              className="size-6 accent-prima-500"
              checked={confirmed}
              onChange={(e) =>
                setConfirmedForKey(e.target.checked ? key : null)
              }
            />
            This is a different person
          </label>
        </div>
      )}

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
          to={`/patients`}
          className="btn btn-secondary"
          onClick={(e) => {
            if (
              isDirty &&
              !isSubmitSuccessful &&
              !window.confirm("Leave without registering this patient?")
            )
              e.preventDefault();
          }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="btn btn-primary md:col-span-2 md:w-72 md:justify-self-end"
          disabled={isSubmitting || (hint !== null && !confirmed)}
        >
          {isSubmitting
            ? "Saving…"
            : editing
              ? "Save changes"
              : "Register patient"}
        </button>
      </StickyActions>
    </form>
  );
}
