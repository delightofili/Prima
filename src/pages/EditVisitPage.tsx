import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { db } from "../db";
import { PageHeader } from "../components/PageHeader";
import { VisitForm } from "../components/VisitForm";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";
import { useI18n } from "../i18n";

export function EditVisitPage() {
  const { id = "", visitId = "" } = useParams();
  const { t } = useI18n();
  const { patientMap, loading } = usePatients("");
  const visit = useLiveQuery(
    async () => (await db.visits.get(visitId)) ?? null,
    [visitId],
  );
  const p = patientMap.get(id);
  usePageTitle(
    p ? t("visit.editPageTitle", { name: p.fullName }) : t("visit.editTitle"),
  );

  if (loading || visit === undefined) return null;
  if (!p || !visit || visit.deletedAt || visit.patientId !== id) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-lg font-semibold">{t("visit.notFound")}</p>
        <Link to={`/patients/${id}`} className="btn btn-secondary">
          {t("visit.backToPatient")}
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
        title={t("visit.editTitle")}
        subtitle={`${p.fullName} · ${p.cardNumber}`}
      />
      <VisitForm patient={p} visit={visit} />
    </>
  );
}
