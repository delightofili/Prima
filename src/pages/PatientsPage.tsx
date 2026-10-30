import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, GitMerge, ScanLine, UserPlus } from "lucide-react";
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
import { useCan } from "../hooks/useCan";
import { logAudit } from "../lib/audit";
import { config } from "../lib/config";
import { useI18n } from "../i18n";

export function PatientsPage() {
  const { t } = useI18n();
  usePageTitle(t("nav.patients"));
  const plan = usePlan();
  const { results } = usePatients("");
  const [upgrade, setUpgrade] = useState(false);

  const exportCsv = () => {
    if (!canUse(plan, "csvExport")) {
      setUpgrade(true);
      return;
    }
    downloadCsv(`prima-patients-${todayISO()}.csv`, patientsToRows(results));
    void logAudit(
      "export.patients",
      "facility",
      config.facilityId,
      `${results.length} patients`,
    );
  };
  const can = useCan();

  return (
    <>
      <PageHeader
        title={t("nav.patients")}
        subtitle={t("patients.subtitle")}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {can("mergeDuplicates") && (
              <Link to="/duplicates" className="btn btn-secondary sm:w-48">
                <GitMerge size={20} className="mr-2" />{" "}
                {t("patients.findDuplicates")}
              </Link>
            )}
            {can("exportData") && (
              <button
                type="button"
                className="btn btn-secondary sm:w-44"
                onClick={exportCsv}
              >
                <Download size={20} className="mr-2" />{" "}
                {t("patients.exportCsv")}
              </button>
            )}
            <Link to="/register" className="btn btn-primary sm:w-44">
              <UserPlus size={20} className="mr-2" /> {t("nav.register")}
            </Link>
            <Link to="/scan" className="btn btn-secondary sm:w-48">
              <ScanLine size={20} className="mr-2" /> {t("scan.title")}
            </Link>
          </div>
        }
      />
      <PatientList />
      {upgrade && (
        <UpgradeDialog
          title={t("patients.exportNeedsBasic")}
          text={t("patients.exportUpgradeText", {
            price: money(PRICES.basic),
          })}
          onClose={() => setUpgrade(false)}
        />
      )}
    </>
  );
}
