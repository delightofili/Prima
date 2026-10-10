import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PatientForm } from "../components/PatientForm";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";
import { useToast } from "../hooks/useToast";

export function EditPatientPage() {
  const { id = "" } = useParams();
  const { patientMap, loading } = usePatients("");
  const navigate = useNavigate();
  const toast = useToast();
  const p = patientMap.get(id);
  usePageTitle(p ? `Edit · ${p.fullName}` : "Edit patient");

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
        title="Edit patient"
        subtitle={`Card number ${p.cardNumber} cannot be changed.`}
      />
      <PatientForm
        patient={p}
        onSaved={() => {
          toast("Changes saved");
          navigate(`/patients/${p.id}`);
        }}
      />
    </>
  );
}
