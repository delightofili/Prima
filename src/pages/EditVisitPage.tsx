import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { db } from "../db";
import { PageHeader } from "../components/PageHeader";
import { VisitForm } from "../components/VisitForm";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";

export function EditVisitPage() {
  const { id = "", visitId = "" } = useParams();
  const { patientMap, loading } = usePatients("");
  const visit = useLiveQuery(
    async () => (await db.visits.get(visitId)) ?? null,
    [visitId],
  );
  const p = patientMap.get(id);
  usePageTitle(p ? `Edit visit · ${p.fullName}` : "Edit visit");

  if (loading || visit === undefined) return null;
  if (!p || !visit || visit.deletedAt || visit.patientId !== id) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-lg font-semibold">Visit not found</p>
        <Link to={`/patients/${id}`} className="btn btn-secondary">
          Back to patient
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
        title="Edit visit"
        subtitle={`${p.fullName} · ${p.cardNumber}`}
      />
      <VisitForm patient={p} visit={visit} />
    </>
  );
}
