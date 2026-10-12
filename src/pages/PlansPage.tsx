import { Check } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PatientLimitBar } from "../components/PatientLimitBar";
import { usePageTitle } from "../hooks/common";
import { usePatients } from "../hooks/usePatients";
import { usePlan } from "../hooks/usePlan";
import { useToast } from "../hooks/useToast";
import { PLANS, setPlan } from "../lib/plan";
import { seedDemo, seedDuplicates } from "../lib/devSeed";

export function PlansPage() {
  usePageTitle("Plans");
  const current = usePlan();
  const { total } = usePatients("");
  const toast = useToast();

  return (
    <>
      <PageHeader
        title="Plans"
        subtitle="Simple monthly pricing for your facility."
      />
      {current === "free" && <PatientLimitBar used={total} />}

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

      {import.meta.env.DEV && (
        <section className="card mt-6 space-y-3">
          <h2 className="text-lg font-bold">Developer tools</h2>
          <p className="text-subtext">
            Adds fake patients, visits and vaccines on this device only. Nothing
            is sent to Supabase. Clear the site data in DevTools to remove them.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[25, 50, 100].map((n) => (
              <button
                key={n}
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  await seedDemo(n);
                  toast(`Added ${n} demo patients`);
                }}
              >
                Add {n} patients
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary sm:w-72"
            onClick={async () => {
              await seedDuplicates(5);
              toast("Added 5 duplicate pairs");
            }}
          >
            Add 5 duplicate pairs
          </button>
        </section>
      )}
    </>
  );
}
