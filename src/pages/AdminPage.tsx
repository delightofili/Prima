import { useState } from "react";
import { AuditView } from "../components/AuditView";
import { ExchangeView } from "../components/ExchangeView";
import { PageHeader } from "../components/PageHeader";
import { RequestsView } from "../components/RequestsView";
import { usePageTitle } from "../hooks/common";
import { useCan } from "../hooks/useCan";

type Tab = "audit" | "requests" | "exchange";

const TABS: { id: Tab; label: string }[] = [
  { id: "audit", label: "Audit log" },
  { id: "requests", label: "Data requests" },
  { id: "exchange", label: "Data exchange" },
];

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
      <PageHeader
        title="Admin tools"
        subtitle="Audit log, data requests and data exchange."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3 md:max-w-2xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn ${tab === t.id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "audit" ? (
        <AuditView />
      ) : tab === "requests" ? (
        <RequestsView />
      ) : (
        <ExchangeView />
      )}
    </>
  );
}
