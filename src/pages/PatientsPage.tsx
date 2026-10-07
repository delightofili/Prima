import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { PatientList } from "../components/PatientList";

export function PatientsPage() {
  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Search by name, phone, NHIS or card number."
        action={
          <Link to="/register" className="btn btn-primary md:w-52">
            Register patient
          </Link>
        }
      />
      <PatientList />
    </>
  );
}
