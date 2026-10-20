import { useState } from "react";
import { AuditView } from "../components/AuditView";
import { PageHeader } from "../components/PageHeader";
import { RequestsView } from "../components/RequestsView";
import { usePageTitle } from "../hooks/common";
import { useCan } from "../hooks/useCan";

type Tab = "audit" | "requests";

export function AdminPage() {
  usePageTitle("Admin tools");
  const can = useCan();
  const [tab, setTab] = useState<Tab>("audit");

  if (!can("viewAudit")) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-lg font-semibold">
          Only a facility admin can open this page.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Admin tools" subtitle="Audit log and data requests." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:max-w-md">
        <button
          type="button"
          className={`btn ${tab === "audit" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("audit")}
        >
          Audit log
        </button>
        <button
          type="button"
          className={`btn ${tab === "requests" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("requests")}
        >
          Data requests
        </button>
      </div>
      {tab === "audit" ? <AuditView /> : <RequestsView />}
    </>
  );
}
