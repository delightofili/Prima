import { useSearchParams } from "react-router-dom";
import { DashboardOverview } from "../components/DashboardOverview";
import { FollowUpsView } from "../components/FollowUpsView";
import { LgaReportView } from "../components/LgaReportView";
import { PageHeader } from "../components/PageHeader";
import { RemindersView } from "../components/RemindersView";
import { usePageTitle } from "../hooks/common";

type Tab = "overview" | "followups" | "reminders" | "report";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "followups", label: "Follow-ups" },
  { id: "reminders", label: "Reminders" },
  { id: "report", label: "LGA report" },
];

export function DashboardPage() {
  usePageTitle("Dashboard");
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = TABS.some((t) => t.id === raw) ? (raw as Tab) : "overview";

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your facility at a glance, calculated on this device."
      />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`inline-flex h-12 shrink-0 items-center rounded-xl border-2 px-5 text-base font-semibold ${
              tab === t.id
                ? "border-prima-500 bg-prima-500 text-white"
                : "border-prima-500 bg-white text-prima-500 hover:bg-prima-50"
            }`}
            onClick={() => setParams(t.id === "overview" ? {} : { tab: t.id })}
          >
            {t.label}
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
