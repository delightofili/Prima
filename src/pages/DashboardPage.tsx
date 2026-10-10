import { useSearchParams } from "react-router-dom";
import { DashboardOverview } from "../components/DashboardOverview";
import { FollowUpsView } from "../components/FollowUpsView";
import { PageHeader } from "../components/PageHeader";
import { usePageTitle } from "../hooks/common";

export function DashboardPage() {
  usePageTitle("Dashboard");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "followups" ? "followups" : "overview";

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your facility at a glance, calculated on this device."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:max-w-md">
        <button
          type="button"
          className={`btn ${tab === "overview" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setParams({})}
        >
          Overview
        </button>
        <button
          type="button"
          className={`btn ${tab === "followups" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setParams({ tab: "followups" })}
        >
          Follow-ups
        </button>
      </div>
      {tab === "overview" ? <DashboardOverview /> : <FollowUpsView />}
    </>
  );
}
