import { Check } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { usePageTitle } from "../hooks/common";
import { usePlan } from "../hooks/usePlan";
import { PLANS, setPlan } from "../lib/plan";

export function PlansPage() {
  usePageTitle("Plans");
  const current = usePlan();

  return (
    <>
      <PageHeader
        title="Plans"
        subtitle="Simple monthly pricing for your facility."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <section
            key={p.id}
            className={`card space-y-3 ${current === p.id ? "border-prima-500" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{p.name}</h2>
              {current === p.id && (
                <span className="rounded-full bg-prima-50 px-3 py-1 text-sm font-semibold text-prima-900">
                  Current plan
                </span>
              )}
            </div>
            <p className="text-3xl font-bold">
              {p.price}
              {p.id !== "free" && (
                <span className="text-base font-medium text-subtext">
                  {" "}
                  / month
                </span>
              )}
            </p>
            <ul className="space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={18} className="mt-0.5 shrink-0 text-ok" /> {f}
                </li>
              ))}
            </ul>
            {import.meta.env.DEV && current !== p.id && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPlan(p.id)}
              >
                Use for testing
              </button>
            )}
          </section>
        ))}
      </div>
      {!import.meta.env.DEV && (
        <p className="mt-4 text-center text-subtext">
          Online payment is coming soon.
        </p>
      )}
    </>
  );
}
