import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Printer } from "lucide-react";
import { db } from "../db";
import { PageHeader } from "../components/PageHeader";
import { PatientCard } from "../components/PatientCard";
import { usePageTitle } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { logAudit } from "../lib/audit";

export function PatientCardPage() {
  usePageTitle("Patient card");
  const { id } = useParams();
  const { facility } = useAuth();
  const patient = useLiveQuery(
    async () => (id ? ((await db.patients.get(id)) ?? null) : null),
    [id],
  );

  if (patient === undefined) return <p className="text-subtext">Loading…</p>;
  if (patient === null || patient.deletedAt) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-lg font-semibold">This patient is not available.</p>
        <Link to="/patients" className="btn btn-secondary">
          Back to patients
        </Link>
      </div>
    );
  }

  const print = () => {
    void logAudit(
      "card.print",
      "patient",
      patient.id,
      `card ${patient.cardNumber}`,
    );
    window.print();
  };

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Patient card"
          subtitle="Printed at bank-card size. Print on card paper, or on plain paper and cut along the line."
        />
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn btn-primary sm:w-48"
            onClick={print}
          >
            <Printer size={20} className="mr-2" /> Print card
          </button>
          <Link
            to={`/patients/${patient.id}`}
            className="btn btn-secondary sm:w-48"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to patient
          </Link>
        </div>
      </div>

      <div className="print-area overflow-x-auto pb-2">
        <PatientCard patient={patient} facilityName={facility?.name ?? ""} />
      </div>

      <p className="no-print mt-4 max-w-md text-sm text-subtext">
        The QR code holds only the card number. Anyone who finds the card cannot
        read the record from it. Scan it in Prima with Scan card.
      </p>
    </>
  );
}
