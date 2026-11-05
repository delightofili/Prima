import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PatientLimitBar } from "../components/PatientLimitBar";
import { usePageTitle } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { usePlan } from "../hooks/usePlan";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n";
import { isDemo } from "../lib/demo";
import {
  PLANS,
  PLAN_FEATURES,
  PLAN_NAME_KEY,
  PRICES,
  setPlan,
  clearPlanOverride,
} from "../lib/plan";
import {
  seedDemo,
  seedDuplicates,
  seedFamilies,
  seedConsent,
  touchPatients,
} from "../lib/devSeed";

export function PlansPage() {
  const { t, money } = useI18n();
  usePageTitle(t("plans.title"));
  const current = usePlan();
  const { role } = useAuth();
  const { total } = usePatients("");
  const toast = useToast();

  return (
    <>
      <PageHeader title={t("plans.title")} subtitle={t("plans.subtitle")} />
      {current === "free" && <PatientLimitBar used={total} />}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <section
            key={p.id}
            className={`card space-y-3 ${current === p.id ? "border-prima-500" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{t(PLAN_NAME_KEY[p.id])}</h2>
              {current === p.id && (
                <span className="rounded-full bg-prima-50 px-3 py-1 text-sm font-semibold text-prima-900">
                  {t("bill.current")}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold">
              {money(p.id === "free" ? 0 : PRICES[p.id])}
              {p.id !== "free" && (
                <span className="text-base font-medium text-subtext">
                  {" "}
                  {t("bill.perMonth", { price: "" }).trim()}
                </span>
              )}
            </p>
            <ul className="space-y-2">
              {PLAN_FEATURES[p.id].map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check
                    size={18}
                    className="mt-0.5 shrink-0 text-ok"
                    aria-hidden
                  />{" "}
                  {t(key)}
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

      {/* Paying lives in Dashboard, under Plan and payment: only the facility admin can pay */}
      <div className="mt-4 space-y-2 text-center">
        {isDemo() ? (
          <p className="text-subtext">{t("demo.noPay")}</p>
        ) : role === "admin" ? (
          <Link
            to="/dashboard?tab=billing"
            className="btn btn-primary mx-auto sm:w-72"
          >
            {t("plans.pay")}
          </Link>
        ) : (
          <p className="text-subtext">{t("plans.askAdmin")}</p>
        )}
      </div>

      {import.meta.env.DEV && (
        <section className="card mt-6 space-y-3">
          <h2 className="text-lg font-bold">Developer tools</h2>
          <p className="text-subtext">
            Adds fake patients, visits and vaccines on this device only. Nothing
            is sent to Supabase. Clear the site data in DevTools to remove them.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {[25, 100, 1000, 5000].map((n) => (
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
          <button
            type="button"
            className="btn btn-secondary sm:w-72"
            onClick={async () => {
              const r = await seedFamilies();
              toast(`Linked ${r.children} children to ${r.families} guardians`);
            }}
          >
            Link demo children to guardians
          </button>
          <button
            type="button"
            className="btn btn-secondary sm:w-72"
            onClick={async () => {
              const n = await seedConsent();
              toast(`Switched on SMS consent for some of ${n} phones`);
            }}
          >
            Switch on SMS consent (demo)
          </button>
          <button
            type="button"
            className="btn btn-secondary sm:w-72"
            onClick={() => {
              clearPlanOverride();
              toast("Using your facility's real plan");
            }}
          >
            Use my facility's real plan
          </button>
          <button
            type="button"
            className="btn btn-secondary sm:w-72"
            onClick={async () => {
              const n = await touchPatients(300);
              toast(`Queued ${n} uploads`);
            }}
          >
            Queue 300 uploads (test)
          </button>
        </section>
      )}
    </>
  );
}
