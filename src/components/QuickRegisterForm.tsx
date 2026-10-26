import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useAuth } from "../hooks/useAuth";
import { useRegistrationTiming } from "../hooks/useRegistrationTiming";
import { useUnsavedWarning } from "../hooks/useUnsavedWarning";
import { calculateAge, isUnder5 } from "../lib/age";
import { checkComplaint } from "../lib/complaintCheck";
import { findDuplicateHint, type DuplicateHint } from "../lib/duplicateHint";
import type { GuardianChoice } from "../lib/guardians";
import { registerPatient } from "../lib/patients";
import { PlanLimitError } from "../lib/plan";
import {
  canBePregnant,
  dobFrom,
  emptyQuick,
  quickToValues,
  validateQuick,
  type QuickErrors,
  type QuickInput,
} from "../lib/quickRegister";
import {
  hasTerm,
  toggleTerm,
  topComplaints,
  topVillages,
} from "../lib/topValues";
import { todayISO } from "../lib/utils";
import type { Patient } from "../types";
import { ComplaintHint } from "./ComplaintHint";
import { Field } from "./FormBits";
import { GuardianPicker } from "./GuardianPicker";
import { StickyActions } from "./StickyActions";

const DEFAULT_COMPLAINTS = [
  "Fever",
  "Cough",
  "Abdominal pain",
  "Headache",
  "Pregnancy or antenatal visit",
  "Immunization or child welfare",
];

function Chips({
  label,
  options,
  isOn,
  onPick,
}: {
  label: string;
  options: string[];
  isOn: (o: string) => boolean;
  onPick: (o: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={isOn(o)}
          onClick={() => onPick(o)}
          className={`min-h-12 rounded-full border-2 px-4 font-semibold ${
            isOn(o)
              ? "border-prima-500 bg-prima-500 text-white"
              : "border-line bg-white hover:bg-prima-50"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; text: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-2"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-12 rounded-xl border-2 font-semibold ${value === o.id ? "border-prima-500 bg-prima-50 text-prima-900" : "border-line bg-white"}`}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}

export function QuickRegisterForm({
  onSaved,
}: {
  onSaved: (patient: Patient) => void;
}) {
  const { facility } = useAuth();
  const navigate = useNavigate();
  const timing = useRegistrationTiming("quick");

  const [q, setQ] = useState<QuickInput>(emptyQuick);
  const [errors, setErrors] = useState<QuickErrors>({});
  const [guardian, setGuardian] = useState<GuardianChoice>({ kind: "none" });
  const [hint, setHint] = useState<DuplicateHint | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof QuickInput>(key: K, value: QuickInput[K]) => {
    setQ((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({
      ...prev,
      [key === "ageValue" || key === "ageUnit" || key === "ageMode"
        ? "age"
        : key]: undefined,
    }));
    if (
      key === "fullName" ||
      key === "ageValue" ||
      key === "ageUnit" ||
      key === "ageMode" ||
      key === "dob" ||
      key === "village" ||
      key === "gender"
    ) {
      setHint(null); // the earlier warning was about different details
      setConfirmed(false);
    }
  };

  const dirty = useMemo(
    () => JSON.stringify(q) !== JSON.stringify(emptyQuick()),
    [q],
  );
  useUnsavedWarning(dirty && !saved);

  // Villages and complaints this clinic uses most, so most registrations are a tap, not typing
  const chips = useLiveQuery(async () => {
    const patients = await db.patients.filter((p) => !p.deletedAt).toArray();
    const visits = await db.visits
      .filter((v) => !v.deletedAt)
      .limit(300)
      .toArray();
    return {
      villages: topVillages(patients),
      complaints: topComplaints(
        [
          ...patients.map((p) => p.initialChiefComplaint ?? ""),
          ...visits.map((v) => v.complaints),
        ].filter(Boolean),
        (t) => checkComplaint(t).recognized,
        DEFAULT_COMPLAINTS,
      ),
    };
  }, []);

  const dob = dobFrom(q);
  const age = dob ? calculateAge(dob) : null;
  const pregnantAllowed = canBePregnant(q.gender, dob);
  const showGuardian = age !== null && isUnder5(age);

  const submit = async (goToVisit: boolean) => {
    const found = validateQuick(q);
    setErrors(found);
    if (Object.keys(found).length > 0 || !facility) {
      document
        .querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const values = quickToValues(q, {
        lga: facility.lga,
        state: facility.state,
      });
      if (!confirmed) {
        const similar = await findDuplicateHint({
          fullName: values.fullName,
          dob: values.dob,
          village: values.village,
          gender: values.gender,
          estimated: !!values.dobEstimated,
        });
        if (similar) {
          setHint(similar);
          return;
        }
      }
      const patient = await registerPatient(values, {}, guardian);
      setSaved(true);
      timing.finish();
      if (goToVisit) navigate(`/patients/${patient.id}/visits/new`);
      else onSaved(patient);
    } catch (e) {
      setProblem(
        e instanceof PlanLimitError
          ? "The Free plan is full. See Plans to add more patients."
          : "Could not save this patient. Please check the details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const villageValue = q.village.trim().toLowerCase();

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      <Field label="Full name" error={errors.fullName}>
        <input
          className="input"
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="next"
          aria-invalid={errors.fullName ? true : undefined}
          value={q.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
      </Field>

      <div className="space-y-1">
        <span className="text-base font-semibold">Sex</span>
        <div
          className="grid grid-cols-2 gap-3"
          role="group"
          aria-label="Sex"
          aria-invalid={errors.gender ? true : undefined}
        >
          {(["FEMALE", "MALE"] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={q.gender === g}
              onClick={() => set("gender", g)}
              className={`min-h-14 rounded-xl border-2 text-lg font-semibold ${
                q.gender === g
                  ? g === "FEMALE"
                    ? "border-prima-500 bg-prima-500 text-white"
                    : "border-blue-600 bg-blue-600 text-white"
                  : "border-line bg-white"
              }`}
            >
              {g === "FEMALE" ? "Female" : "Male"}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.gender}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-base font-semibold">Age</span>
        <Segment
          label="How to give the age"
          value={q.ageMode}
          onChange={(v) => set("ageMode", v)}
          options={[
            { id: "age", text: "Age" },
            { id: "date", text: "Birth date" },
          ]}
        />
        {q.ageMode === "age" ? (
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <input
              className="input text-xl font-semibold"
              inputMode="numeric"
              maxLength={3}
              aria-label="Age"
              placeholder="e.g. 34"
              aria-invalid={errors.age ? true : undefined}
              value={q.ageValue}
              onChange={(e) =>
                set("ageValue", e.target.value.replace(/\D/g, ""))
              }
            />
            <Segment
              label="Years or months"
              value={q.ageUnit}
              onChange={(v) => set("ageUnit", v)}
              options={[
                { id: "years", text: "Years" },
                { id: "months", text: "Months" },
              ]}
            />
          </div>
        ) : (
          <input
            type="date"
            className="input"
            aria-label="Date of birth"
            max={todayISO()}
            aria-invalid={errors.dob ? true : undefined}
            value={q.dob}
            onChange={(e) => set("dob", e.target.value)}
          />
        )}
        {(errors.age || errors.dob) && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.age ?? errors.dob}
          </p>
        )}
        {age && !errors.age && !errors.dob && (
          <p className="text-sm text-subtext">
            {q.ageMode === "age"
              ? "Saved as an estimate. The profile will ask for the real date later."
              : `Age ${age.label}.`}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Field label="Village or area" error={errors.village}>
          <input
            className="input"
            autoComplete="off"
            aria-invalid={errors.village ? true : undefined}
            value={q.village}
            onChange={(e) => set("village", e.target.value)}
          />
        </Field>
        <Chips
          label="Villages used recently"
          options={chips?.villages ?? []}
          isOn={(o) => o.toLowerCase() === villageValue}
          onPick={(o) => set("village", o)}
        />
      </div>

      {pregnantAllowed && (
        <label className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-line bg-white p-3 font-semibold">
          <input
            type="checkbox"
            className="size-6 accent-prima-500"
            checked={q.pregnant}
            onChange={(e) => set("pregnant", e.target.checked)}
          />
          Pregnant now
        </label>
      )}

      <div className="space-y-2">
        <span className="text-base font-semibold">Reason for visit</span>
        {!q.registrationOnly && (
          <>
            <Chips
              label="Common reasons"
              options={chips?.complaints ?? DEFAULT_COMPLAINTS}
              isOn={(o) => hasTerm(q.complaint, o)}
              onPick={(o) => set("complaint", toggleTerm(q.complaint, o))}
            />
            <input
              className="input"
              placeholder="Or type it"
              autoComplete="off"
              aria-label="Reason for visit"
              aria-invalid={errors.complaint ? true : undefined}
              value={q.complaint}
              onChange={(e) => set("complaint", e.target.value)}
            />
            <ComplaintHint
              value={q.complaint}
              onReplace={(v) => set("complaint", v)}
            />
          </>
        )}
        <label className="flex min-h-12 items-center gap-3 font-medium">
          <input
            type="checkbox"
            className="size-6 accent-prima-500"
            checked={q.registrationOnly}
            onChange={(e) => set("registrationOnly", e.target.checked)}
          />
          Registration only (no visit now)
        </label>
        {errors.complaint && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.complaint}
          </p>
        )}
      </div>

      <Field label="Phone (optional)" error={errors.phone}>
        <input
          className="input"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="08031234567"
          aria-invalid={errors.phone ? true : undefined}
          value={q.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </Field>

      {showGuardian && (
        <details className="rounded-xl border-2 border-line bg-white">
          <summary className="flex min-h-12 cursor-pointer items-center px-3 font-semibold">
            Parent or guardian (optional)
          </summary>
          <div className="border-t-2 border-line p-3">
            <GuardianPicker
              value={guardian}
              onChange={setGuardian}
              nextOfKin={{ name: "", phone: "" }}
            />
          </div>
        </details>
      )}

      <label className="flex min-h-12 items-start gap-3 rounded-xl border-2 border-line bg-white p-3">
        <input
          type="checkbox"
          className="mt-1 size-6 accent-prima-500"
          checked={q.noticeGiven}
          onChange={(e) => set("noticeGiven", e.target.checked)}
        />
        <span>
          <span className="block font-semibold">Privacy notice explained</span>
          <span className="block text-sm text-subtext">
            Tell the patient how their information is used. You can record this
            later from the profile.
          </span>
        </span>
      </label>

      {hint && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4"
        >
          <p className="font-semibold">
            {hint.kind === "exact"
              ? "This patient may already be registered."
              : "A similar patient is already registered."}
          </p>
          <ul className="space-y-2">
            {(hint.kind === "exact"
              ? [hint.patient]
              : hint.matches.map((m: { patient: Patient }) => m.patient)
            ).map((p: Patient) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3"
              >
                <span>
                  {p.fullName}, {calculateAge(p.dob).label}, {p.village}
                  <span className="block font-mono text-sm text-subtext">
                    {p.cardNumber}
                  </span>
                </span>
                <Link
                  to={`/patients/${p.id}`}
                  className="shrink-0 font-semibold text-prima-500 underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
          <label className="flex min-h-12 items-center gap-3 font-semibold">
            <input
              type="checkbox"
              className="size-6 accent-prima-500"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            This is a different person
          </label>
        </div>
      )}

      {problem && (
        <p role="alert" className="rounded-xl bg-accent-50 p-3 font-medium">
          {problem}
        </p>
      )}

      <StickyActions note={dirty ? "Unsaved changes" : undefined}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || (hint !== null && !confirmed)}
          onClick={() => void submit(false)}
        >
          {busy ? "Saving…" : "Register"}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || (hint !== null && !confirmed)}
          onClick={() => void submit(true)}
        >
          Register and add visit
        </button>
      </StickyActions>
    </div>
  );
}
