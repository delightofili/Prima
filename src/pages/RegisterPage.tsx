import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PatientForm } from "../components/PatientForm";
import { calculateAge } from "../lib/age";
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
        {patient.fullName}, {age.label}
      </p>
      {patient.initialChiefComplaint && (
        <p className="text-left">
          <span className="font-semibold">Reason for first registration:</span>{" "}
          {patient.initialChiefComplaint}
        </p>
      )}
      <Link to={`/patients/${patient.id}`} className="btn btn-primary">
        View profile
      </Link>
      <button className="btn btn-secondary" onClick={onNew}>
        Register another patient
      </button>
    </section>
  );
}

export function RegisterPage() {
  const [saved, setSaved] = useState<Patient | null>(null);
  return (
    <>
      <PageHeader
        title="Register patient"
        subtitle="Saved on this device first, then synced when online."
      />
      {saved ? (
        <SavedCard patient={saved} onNew={() => setSaved(null)} />
      ) : (
        <PatientForm onSaved={setSaved} />
      )}
    </>
  );
}
