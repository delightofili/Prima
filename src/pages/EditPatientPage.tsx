import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PatientForm } from "../components/PatientForm";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n";

export function EditPatientPage() {
  const { id = "" } = useParams();
  const { t } = useI18n();
  const { patientMap, loading } = usePatients("");
  const navigate = useNavigate();
  const toast = useToast();
  const p = patientMap.get(id);
  usePageTitle(
    p
      ? t("patient.editPageTitle", { name: p.fullName })
      : t("patient.editTitle"),
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
        title={t("patient.editTitle")}
        subtitle={t("patient.cardFixed", { card: p.cardNumber })}
      />
      <PatientForm
        patient={p}
        onSaved={() => {
          toast(t("common.changesSaved"));
          navigate(`/patients/${p.id}`);
        }}
      />
    </>
  );
}
