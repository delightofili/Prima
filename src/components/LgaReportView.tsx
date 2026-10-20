import { useState, type ReactNode } from "react";
import { Download, Stethoscope, UserPlus, Users } from "lucide-react";
import { useLgaReport } from "../hooks/useLgaReport";
import { usePlan } from "../hooks/usePlan";
import { config } from "../lib/config";
import { downloadCsv } from "../lib/csv";
import { reportToRows } from "../lib/lgaReport";
import { canUse } from "../lib/plan";
import { monthLabel, monthOf, todayISO } from "../lib/utils";
import { MonthNav } from "./MonthNav";
import { StatTile } from "./StatTile";
import { UpgradeCard } from "./UpgradeCard";
import { UpgradeDialog } from "./UpgradeDialog";
import { PRICES, money } from "../lib/plan";
import { useCan } from "../hooks/useCan";
import { logAudit } from "../lib/audit";

function ReportCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function SimpleTable({
  head,
  rows,
  numericFrom,
}: {
  head: string[];
  rows: (string | number)[][];
  numericFrom: number;
}) {
  const align = (i: number) =>
    i >= numericFrom ? "text-right tabular-nums" : "";

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-line text-sm text-subtext">
            {head.map((h, i) => (
              <th key={h} className={`py-2 pr-3 font-semibold ${align(i)}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-line last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`py-2 pr-3 ${align(i)}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LgaReportView() {
  const plan = usePlan();
  const [month, setMonth] = useState(monthOf(todayISO()));
  const [upgrade, setUpgrade] = useState(false);
  const report = useLgaReport(month);
  const can = useCan();

  if (!report) return null;
  const unlocked = canUse(plan, "lgaReport");

  const exportReport = () => {
    if (!canUse(plan, "csvExport")) {
      setUpgrade(true);
      return;
    }
    downloadCsv(
      `prima-lga-report-${month}.csv`,
      reportToRows(report, {
        name: config.facilityName,
        lga: config.facilityLga,
        state: config.facilityState,
      }),
    );
    void logAudit("export.report", "facility", config.facilityId, month);
  };

  return (
    <div className="space-y-5">
      <MonthNav month={month} onChange={setMonth} />

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{config.facilityName}</h2>
          <p className="text-subtext">
            {config.facilityLga} LGA, {config.facilityState} ·{" "}
            {monthLabel(month)}
          </p>
        </div>
        {can("exportData") ? (
          <button
            type="button"
            className="btn btn-primary md:w-60"
            onClick={exportReport}
          >
            <Download size={20} className="mr-2" /> Download report (CSV)
          </button>
        ) : (
          <p className="text-sm text-subtext">
            Ask your facility admin to download the report.
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="New registrations"
          value={report.newRegistrations}
          icon={UserPlus}
        />
        <StatTile
          label="Patients seen"
          value={report.patientsSeen}
          icon={Users}
        />
        <StatTile
          label="Total visits"
          value={report.totalVisits}
          icon={Stethoscope}
        />
      </section>

      {unlocked ? (
        <>
          <ReportCard title="Visits by age group and sex">
            <SimpleTable
              head={["Age group", "Male", "Female", "Total"]}
              numericFrom={1}
              rows={report.ageSex.map((a) => [
                a.label,
                a.male,
                a.female,
                a.male + a.female,
              ])}
            />
          </ReportCard>

          <ReportCard title="Top diagnoses">
            {report.diagnoses.length ? (
              <SimpleTable
                head={["Code", "Diagnosis", "Male", "Female", "Total"]}
                numericFrom={2}
                rows={report.diagnoses.map((d) => [
                  d.code || "—",
                  d.label,
                  d.male,
                  d.female,
                  d.male + d.female,
                ])}
              />
            ) : (
              <p className="py-4 text-subtext">
                No diagnoses recorded this month.
              </p>
            )}
          </ReportCard>

          <ReportCard title="Immunization doses given">
            {report.vaccines.length ? (
              <SimpleTable
                head={["Vaccine", "Doses"]}
                numericFrom={1}
                rows={report.vaccines.map((v) => [v.label, v.doses])}
              />
            ) : (
              <p className="py-4 text-subtext">
                No vaccine doses recorded this month.
              </p>
            )}
          </ReportCard>

          <ReportCard title="Maternal and child (from coded visits)">
            <SimpleTable
              head={["Service", "Visits"]}
              numericFrom={1}
              rows={report.maternalChild.map((m) => [m.label, m.value])}
            />
          </ReportCard>

          <p className="text-center text-sm text-subtext">
            Built from records on this device. This is not the official NHMIS
            form, so check your LGA's format.
          </p>
        </>
      ) : (
        <UpgradeCard
          title="Unlock the monthly LGA report"
          text={`Basic (${money(PRICES.basic)} a month) gives you the full breakdown by age, sex and diagnosis, vaccine counts, and a CSV you can send to your LGA.`}
        />
      )}

      {upgrade && (
        <UpgradeDialog
          title="Export needs the Basic plan"
          text={`Upgrade to Basic (${money(PRICES.basic)} a month) to download the LGA report and your patient register as CSV.`}
          onClose={() => setUpgrade(false)}
        />
      )}
    </div>
  );
}
