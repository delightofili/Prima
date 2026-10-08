import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { VisitForm } from "../components/VisitForm";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";

export function NewVisitPage() {
  const { id = "" } = useParams();
  const { patientMap, loading } = usePatients("");
  const p = patientMap.get(id);
  usePageTitle(p ? `New visit · ${p.fullName}` : "New visit");

  if (loading) return null;
  if (!p) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-lg font-semibold">Patient not found</p>
        <Link to="/patients" className="btn btn-secondary">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        to={`/patients/${p.id}`}
        className="mb-3 inline-flex items-center gap-2 font-semibold text-prima-500"
      >
        <ArrowLeft size={20} /> {p.fullName}
      </Link>
      <PageHeader
        title="New visit"
        subtitle={`${p.fullName} · ${p.cardNumber}`}
      />
      <VisitForm patient={p} />
    </>
  );
}
