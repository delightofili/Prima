import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { config } from "./lib/config";
import { calculateAge } from "./lib/age";
import { PatientForm } from "./components/PatientForm";
import { PatientList } from "./components/PatientList";
import { SyncBadge } from "./components/SyncBadge";
import type { Patient } from "./types";

type Tab = "register" | "patients";

function SavedCard({
  patient,
  onNew,
  onList,
}: {
  patient: Patient;
  onNew: () => void;
  onList: () => void;
}) {
  const age = calculateAge(patient.dob);
  return (
    <section className="card space-y-3 text-center">
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
      <button className="btn btn-primary" onClick={onNew}>
        Register another patient
      </button>
      <button className="btn btn-secondary" onClick={onList}>
        View patients
      </button>
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("register");
  const [saved, setSaved] = useState<Patient | null>(null);
  const count = useLiveQuery(() => db.patients.count(), [], 0);

  return (
    <div className="mx-auto min-h-screen max-w-xl pb-16">
      <header className="flex items-center justify-between bg-prima-500 px-4 py-3 text-white">
        <div>
          <h1 className="text-xl font-bold">Prima</h1>
          <p className="text-sm text-prima-50">{config.facilityName}</p>
        </div>
        <SyncBadge />
      </header>

      <nav className="grid grid-cols-2 gap-3 p-4">
        {(["register", "patients"] as const).map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setTab(t);
              setSaved(null);
            }}
          >
            {t === "register" ? "Register" : `Patients (${count})`}
          </button>
        ))}
      </nav>

      <main className="px-4">
        {tab === "patients" ? (
          <PatientList />
        ) : saved ? (
          <SavedCard
            patient={saved}
            onNew={() => setSaved(null)}
            onList={() => {
              setSaved(null);
              setTab("patients");
            }}
          />
        ) : (
          <PatientForm onSaved={setSaved} />
        )}
      </main>
    </div>
  );
}
