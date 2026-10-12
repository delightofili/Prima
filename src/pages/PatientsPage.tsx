import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, GitMerge, UserPlus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PatientList } from "../components/PatientList";
import { UpgradeDialog } from "../components/UpgradeDialog";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";
import { usePlan } from "../hooks/usePlan";
import { downloadCsv } from "../lib/csv";
import { patientsToRows } from "../lib/exports";
import { canUse } from "../lib/plan";
import { todayISO } from "../lib/utils";
import { PRICES, money } from "../lib/plan";

export function PatientsPage() {
  usePageTitle("Patients");
  const plan = usePlan();
  const { results } = usePatients("");
  const [upgrade, setUpgrade] = useState(false);

  const exportCsv = () => {
    if (!canUse(plan, "csvExport")) {
      setUpgrade(true);
      return;
    }
    downloadCsv(`prima-patients-${todayISO()}.csv`, patientsToRows(results));
  };

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Search by name, phone, NHIS or card number."
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link to="/duplicates" className="btn btn-secondary sm:w-48">
              <GitMerge size={20} className="mr-2" /> Find duplicates
            </Link>
            <button
              type="button"
              className="btn btn-secondary sm:w-44"
              onClick={exportCsv}
            >
              <Download size={20} className="mr-2" /> Export CSV
            </button>
            <Link to="/register" className="btn btn-primary sm:w-44">
              <UserPlus size={20} className="mr-2" /> Register
            </Link>
          </div>
        }
      />
      <PatientList />
      {upgrade && (
        <UpgradeDialog
          title="Export needs the Basic plan"
          text={`Upgrade to Basic (${money(PRICES.basic)} a month) to download your full patient register as CSV, and the LGA report too.`}
          onClose={() => setUpgrade(false)}
        />
      )}
    </>
  );
}
