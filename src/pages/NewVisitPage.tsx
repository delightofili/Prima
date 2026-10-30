import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { VisitForm } from "../components/VisitForm";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";
import { useI18n } from "../i18n";

export function NewVisitPage() {
  const { id = "" } = useParams();
  const { t } = useI18n();
  const { patientMap, loading } = usePatients("");
  const p = patientMap.get(id);
  usePageTitle(
    p ? t("visit.newPageTitle", { name: p.fullName }) : t("visit.newTitle"),
  );

  if (loading) return null;
  if (!p) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <p className="text-lg font-semibold">{t("patient.notFound")}</p>
        <Link to="/patients" className="btn btn-secondary">
          {t("patient.backToPatients")}
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
        title={t("visit.newTitle")}
        subtitle={`${p.fullName} · ${p.cardNumber}`}
      />
      <VisitForm patient={p} />
    </>
  );
}
