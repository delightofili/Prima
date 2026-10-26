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
  const age = calculateAge(patient.dob);
  return (
    <section className="card mx-auto max-w-lg space-y-3 text-center">
      <div className="flex justify-center text-ok">
        <CircleCheck size={40} />
      </div>
      <p className="text-sm font-semibold uppercase text-subtext">
        Patient registered
      </p>
      <p className="text-3xl font-bold tracking-wider text-prima-500">
        {patient.cardNumber}
      </p>
      <p className="text-lg font-semibold">
        {patient.fullName}, {patient.dobEstimated ? "about " : ""}
        {age.label}
      </p>
      {patient.initialChiefComplaint && (
        <p className="text-left">
          <span className="font-semibold">Reason for first registration:</span>{" "}
          {patient.initialChiefComplaint}
        </p>
      )}
      <Link
        to={`/patients/${patient.id}/visits/new`}
        className="btn btn-primary"
      >
        Record the visit
      </Link>
      <Link to={`/patients/${patient.id}`} className="btn btn-secondary">
        View profile
      </Link>
      <Link
        to={`/patients/${patient.id}/card`}
        className="inline-block min-h-12 font-semibold text-prima-500 underline"
      >
        Print card
      </Link>
      <button className="btn btn-secondary" onClick={onNew}>
        Register another patient
      </button>
    </section>
  );
}

export function RegisterPage() {
  usePageTitle("Register patient");
  const plan = usePlan();
  const { total } = usePatients("");
  const [saved, setSaved] = useState<Patient | null>(null);
  const [mode, setMode] = useRegisterMode();

  const limited = !canUse(plan, "unlimitedPatients");
  const atLimit = limited && total >= FREE_PATIENT_LIMIT;

  return (
    <>
      <PageHeader
        title="Register patient"
        subtitle="Saved on this device first, then synced when online."
      />
      {limited && <PatientLimitBar used={total} />}
      {saved ? (
        <SavedCard patient={saved} onNew={() => setSaved(null)} />
      ) : atLimit ? (
        <UpgradeCard
          title="You've reached 200 patients"
          text="The Free plan holds 200 patients. Basic removes the limit and adds CSV export and the monthly LGA report. See Plans for prices."
        />
      ) : (
        <>
          <button
            type="button"
            className="mb-4 min-h-12 font-semibold text-prima-500 underline"
            onClick={() => setMode(mode === "quick" ? "full" : "quick")}
          >
            {mode === "quick"
              ? "Need more details? Use the full form"
              : "Use the quick form"}
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
