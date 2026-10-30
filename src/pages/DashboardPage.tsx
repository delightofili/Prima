import { useSearchParams } from "react-router-dom";
import { DashboardOverview } from "../components/DashboardOverview";
import { FollowUpsView } from "../components/FollowUpsView";
import { LgaReportView } from "../components/LgaReportView";
import { PageHeader } from "../components/PageHeader";
import { RemindersView } from "../components/RemindersView";
import { usePageTitle } from "../hooks/common";
import { useI18n, type Key } from "../i18n";

type Tab = "overview" | "followups" | "reminders" | "report";

const TABS: { id: Tab; label: Key }[] = [
  { id: "overview", label: "dash.tabOverview" },
  { id: "followups", label: "dash.tabFollowUps" },
  { id: "reminders", label: "dash.tabReminders" },
  { id: "report", label: "dash.tabReport" },
];

export function DashboardPage() {
  const { t } = useI18n();
  usePageTitle(t("nav.dashboard"));
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = TABS.some((x) => x.id === raw) ? (raw as Tab) : "overview";

  return (
    <>
      <PageHeader title={t("nav.dashboard")} subtitle={t("dash.subtitle")} />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            className={`inline-flex h-12 shrink-0 items-center rounded-xl border-2 px-5 text-base font-semibold ${
              tab === x.id
                ? "border-prima-500 bg-prima-500 text-white"
                : "border-prima-500 bg-white text-prima-500 hover:bg-prima-50"
            }`}
            onClick={() => setParams(x.id === "overview" ? {} : { tab: x.id })}
          >
            {t(x.label)}
          </button>
        ))}
      </div>
      {tab === "overview" && <DashboardOverview />}
      {tab === "followups" && <FollowUpsView />}
      {tab === "reminders" && <RemindersView />}
      {tab === "report" && <LgaReportView />}
    </>
  );
}
