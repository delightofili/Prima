import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useAuth } from "../hooks/useAuth";
import { useRegistrationTiming } from "../hooks/useRegistrationTiming";
import { useUnsavedWarning } from "../hooks/useUnsavedWarning";
import { useI18n, type Key } from "../i18n";
import { calculateAge, isUnder5, type Age } from "../lib/age";
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
  const { t, tp } = useI18n();
  const ageText = (a: Age) =>
    tp(a.unit === "years" ? "age.years" : "age.months", a.value);
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
          ? t("register.planFull")
          : t("register.saveFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const villageValue = q.village.trim().toLowerCase();

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      <Field
        label={t("register.fullName")}
        error={errors.fullName && t(errors.fullName)}
      >
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
        <span className="text-base font-semibold">{t("register.sex")}</span>
        <div
          className="grid grid-cols-2 gap-3"
          role="group"
          aria-label={t("register.sex")}
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
              {t(g === "FEMALE" ? "register.female" : "register.male")}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p role="alert" className="text-sm font-medium text-danger">
            {t(errors.gender)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-base font-semibold">{t("register.age")}</span>
        <Segment
          label={t("register.howToGiveAge")}
          value={q.ageMode}
          onChange={(v) => set("ageMode", v)}
          options={[
            { id: "age", text: t("register.byAge") },
            { id: "date", text: t("register.byBirthDate") },
          ]}
        />
        {q.ageMode === "age" ? (
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <input
              className="input text-xl font-semibold"
              inputMode="numeric"
              maxLength={3}
              aria-label={t("register.age")}
              placeholder={t("register.agePlaceholder")}
              aria-invalid={errors.age ? true : undefined}
              value={q.ageValue}
              onChange={(e) =>
                set("ageValue", e.target.value.replace(/\D/g, ""))
              }
            />
            <Segment
              label={t("register.yearsOrMonths")}
              value={q.ageUnit}
              onChange={(v) => set("ageUnit", v)}
              options={[
                { id: "years", text: t("register.years") },
                { id: "months", text: t("register.months") },
              ]}
            />
          </div>
        ) : (
          <input
            type="date"
            className="input"
            aria-label={t("register.dateOfBirth")}
            max={todayISO()}
            aria-invalid={errors.dob ? true : undefined}
            value={q.dob}
            onChange={(e) => set("dob", e.target.value)}
          />
        )}
        {(errors.age || errors.dob) && (
          <p role="alert" className="text-sm font-medium text-danger">
            {t((errors.age ?? errors.dob) as Key)}
          </p>
        )}
        {age && !errors.age && !errors.dob && (
          <p className="text-sm text-subtext">
            {q.ageMode === "age"
              ? t("register.estimateNote")
              : t("register.ageIs", { age: ageText(age) })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Field
          label={t("register.village")}
          error={errors.village && t(errors.village)}
        >
          <input
            className="input"
            autoComplete="off"
            aria-invalid={errors.village ? true : undefined}
            value={q.village}
            onChange={(e) => set("village", e.target.value)}
          />
        </Field>
        <Chips
          label={t("register.villagesRecent")}
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
          {t("register.pregnantNow")}
        </label>
      )}

      <div className="space-y-2">
        <span className="text-base font-semibold">{t("register.reason")}</span>
        {!q.registrationOnly && (
          <>
            <Chips
              label={t("register.commonReasons")}
              options={chips?.complaints ?? DEFAULT_COMPLAINTS}
              isOn={(o) => hasTerm(q.complaint, o)}
              onPick={(o) => set("complaint", toggleTerm(q.complaint, o))}
            />
            <input
              className="input"
              placeholder={t("register.orTypeIt")}
              autoComplete="off"
              aria-label={t("register.reason")}
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
          {t("register.registrationOnly")}
        </label>
        {errors.complaint && (
          <p role="alert" className="text-sm font-medium text-danger">
            {t(errors.complaint)}
          </p>
        )}
      </div>

      <Field
        label={t("register.phoneOptional")}
        error={errors.phone && t(errors.phone)}
      >
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
            {t("register.guardianOptional")}
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
          <span className="block font-semibold">
            {t("register.noticeTitle")}
          </span>
          <span className="block text-sm text-subtext">
            {t("register.noticeHelp")}
          </span>
        </span>
      </label>

      {hint && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border-2 border-accent-500 bg-accent-50 p-4"
        >
          <p className="font-semibold">
            {t(
              hint.kind === "exact"
                ? "register.duplicateExact"
                : "register.duplicateSimilar",
            )}
          </p>
          <ul className="space-y-2">
            {(hint.kind === "exact"
              ? [hint.patient]
              : hint.matches.map((m) => m.patient)
            ).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3"
              >
                <span>
                  {p.fullName}, {ageText(calculateAge(p.dob))}, {p.village}
                  <span className="block font-mono text-sm text-subtext">
                    {p.cardNumber}
                  </span>
                </span>
                <Link
                  to={`/patients/${p.id}`}
                  className="shrink-0 font-semibold text-prima-500 underline"
                >
                  {t("common.open")}
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
            {t("register.differentPerson")}
          </label>
        </div>
      )}

      {problem && (
        <p role="alert" className="rounded-xl bg-accent-50 p-3 font-medium">
          {problem}
        </p>
      )}

      <StickyActions note={dirty ? t("register.unsaved") : undefined}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || (hint !== null && !confirmed)}
          onClick={() => void submit(false)}
        >
          {busy ? t("register.saving") : t("register.submit")}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || (hint !== null && !confirmed)}
          onClick={() => void submit(true)}
        >
          {t("register.submitAndVisit")}
        </button>
      </StickyActions>
    </div>
  );
}
