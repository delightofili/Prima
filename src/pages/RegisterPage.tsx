import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PatientForm } from "../components/PatientForm";
import { PatientLimitBar } from "../components/PatientLimitBar";
import { QuickRegisterForm } from "../components/QuickRegisterForm";
import { UpgradeCard } from "../components/UpgradeCard";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";
import { usePlan } from "../hooks/usePlan";
import { useRegisterMode } from "../hooks/useRegisterMode";
import { useI18n } from "../i18n";
import { calculateAge } from "../lib/age";
import { FREE_PATIENT_LIMIT, canUse } from "../lib/plan";
import type { Patient } from "../types";

function SavedCard({
  patient,
  onNew,
}: {
  patient: Patient;
  onNew: () => void;
}) {
  const { t, tp } = useI18n();
  const a = calculateAge(patient.dob);
  const age = tp(a.unit === "years" ? "age.years" : "age.months", a.value);
  return (
    <section className="card mx-auto max-w-lg space-y-3 text-center">
      <div className="flex justify-center text-ok">
        <CircleCheck size={40} />
      </div>
      <p className="text-sm font-semibold uppercase text-subtext">
        {t("saved.title")}
      </p>
      <p className="text-3xl font-bold tracking-wider text-prima-500">
        {patient.cardNumber}
      </p>
      <p className="text-lg font-semibold">
        {patient.fullName},{" "}
        {patient.dobEstimated ? t("saved.about", { age }) : age}
      </p>
      {patient.initialChiefComplaint && (
        <p className="text-left">
          <span className="font-semibold">{t("saved.firstReason")}</span>{" "}
          {patient.initialChiefComplaint}
        </p>
      )}
      <Link
        to={`/patients/${patient.id}/visits/new`}
        className="btn btn-primary"
      >
        {t("saved.recordVisit")}
      </Link>
      <Link to={`/patients/${patient.id}`} className="btn btn-secondary">
        {t("saved.viewProfile")}
      </Link>
      <Link
        to={`/patients/${patient.id}/card`}
        className="inline-block min-h-12 font-semibold text-prima-500 underline"
      >
        {t("saved.printCard")}
      </Link>
      <button className="btn btn-secondary" onClick={onNew}>
        {t("saved.another")}
      </button>
    </section>
  );
}

export function RegisterPage() {
  const { t } = useI18n();
  usePageTitle(t("register.title"));
  const plan = usePlan();
  const { total } = usePatients("");
  const [saved, setSaved] = useState<Patient | null>(null);
  const [mode, setMode] = useRegisterMode();

  const limited = !canUse(plan, "unlimitedPatients");
  const atLimit = limited && total >= FREE_PATIENT_LIMIT;

  return (
    <>
      <PageHeader
        title={t("register.title")}
        subtitle={t("register.subtitle")}
      />
      {limited && <PatientLimitBar used={total} />}
      {saved ? (
        <SavedCard patient={saved} onNew={() => setSaved(null)} />
      ) : atLimit ? (
        <UpgradeCard
          title={t("register.limitTitle")}
          text={t("register.limitText")}
        />
      ) : (
        <>
          <button
            type="button"
            className="mb-4 min-h-12 font-semibold text-prima-500 underline"
            onClick={() => setMode(mode === "quick" ? "full" : "quick")}
          >
            {t(mode === "quick" ? "register.useFull" : "register.useQuick")}
          </button>
          {mode === "quick" ? (
            <QuickRegisterForm onSaved={setSaved} />
          ) : (
            <PatientForm onSaved={setSaved} />
          )}
        </>
      )}
    </>
  );
}
