import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CircleCheck,
  CreditCard,
  Loader,
  RefreshCw,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { useOnline } from "../hooks/common";
import { useAuth } from "../hooks/useAuth";
import {
  checkPayment,
  dismissReturn,
  loadBilling,
  useBilling,
} from "../hooks/useBilling";
import { useClock } from "../hooks/useDevices";
import { useToast } from "../hooks/useToast";
import { useI18n, type Key } from "../i18n";
import {
  BillError,
  FREE_PATIENT_LIMIT,
  blockedPlan,
  goToCheckout,
  cancelRenewal,
  nairaOf,
  optionOf,
  readPending,
  referenceFromUrl,
  standing,
  startCheckout,
  yearlySaving,
  type Billing,
  type BillProblem,
  type Cycle,
  type PlanId,
  type PlanName,
} from "../lib/billing";
import { ConfirmDialog } from "./ConfirmDialog";

const PLAN_NAME: Record<PlanName, Key> = {
  free: "bill.free",
  basic: "bill.basic",
  pro: "bill.pro",
};
const CYCLE_NAME: Record<Cycle, Key> = {
  monthly: "bill.cycleMonthly",
  annual: "bill.cycleAnnual",
};
const STATUS: Record<"success" | "pending" | "failed", Key> = {
  success: "bill.st.success",
  pending: "bill.st.pending",
  failed: "bill.st.failed",
};

// What to say for each thing that can go wrong when asking the server
const PROBLEM: Record<BillProblem, Key> = {
  offline: "bill.offline",
  signin: "bill.err.signin",
  not_admin: "bill.err.notAdmin",
  lower_plan: "bill.err.failed", // the screen explains this one itself, with the date
  no_autorenew: "bill.err.noAuto",
  no_email: "bill.err.noEmail",
  paystack: "bill.err.paystack",
  no_subscription: "bill.err.failed",
  amount: "bill.err.failed",
  currency: "bill.err.failed",
  plan: "bill.err.failed",
  failed_before: "bill.err.failed",
  mismatch: "bill.err.failed",
  unknown_reference: "bill.err.failed",
  misconfigured: "bill.err.misconfigured",
  server: "bill.err.server",
  failed: "bill.err.failed",
};

function Note({
  tone,
  icon,
  children,
}: {
  tone: "good" | "warn";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "warn" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-2xl border-2 p-4 font-medium ${tone === "warn" ? "border-accent-500 bg-accent-50" : "border-prima-500 bg-prima-50"}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

// The line under the plan name: what is paid for, until when, and what happens next
function StandingLine({ b, now }: { b: Billing; now: number }) {
  const { t, tp, date } = useI18n();
  const s = standing(b, now);
  switch (s.kind) {
    case "free":
      return (
        <p className="text-lg">
          {t("bill.s.free", { limit: FREE_PATIENT_LIMIT })}
        </p>
      );
    case "expired":
      return <p className="text-lg">{t("bill.s.expired")}</p>;
    case "pilot":
      return (
        <p className="text-lg">{t("bill.s.pilot", { date: date(s.until) })}</p>
      );
    case "pastDue":
      return (
        <p className="text-lg font-medium text-danger">
          {t("bill.s.pastDue", { date: date(s.graceUntil) })}
        </p>
      );
    case "active":
      return (
        <div className="space-y-1 text-lg">
          <p>{tp("bill.s.active", s.daysLeft, { date: date(s.until) })}</p>
          <p className="text-subtext">
            {s.renews
              ? t("bill.s.renews")
              : t("bill.s.ends", { date: date(s.until) })}
          </p>
        </div>
      );
  }
}

export function BillingView() {
  const { t, money, date } = useI18n();
  const { facility, refreshFacility } = useAuth();
  const toast = useToast();
  const online = useOnline();
  const now = useClock();
  const { billing, problem, loaded, back } = useBilling();
  const [, setParams] = useSearchParams();

  // Paystack sends the person back here. The reference is read once, when the screen opens.
  const [reference] = useState(
    () => referenceFromUrl(window.location.search) ?? readPending(),
  );
  // These two change identity whenever the page or the address changes, so they are kept in refs: the check must run once
  const refresh = useRef(refreshFacility);
  const changeParams = useRef(setParams);
  useEffect(() => {
    refresh.current = refreshFacility;
    changeParams.current = setParams;
  });
  // The server is the truth about the plan. If the app still believes something else (a plan ended, or was granted by hand),
  // the app's own copy of the facility is refreshed, once for each plan the server reports.
  const syncedPlan = useRef<string | null>(null);
  useEffect(() => {
    if (
      !billing ||
      !facility ||
      billing.plan === facility.plan ||
      syncedPlan.current === billing.plan
    )
      return;
    syncedPlan.current = billing.plan;
    void refresh.current();
  }, [billing, facility]);

  // Asks the server about a payment, and lets the reference go from the address once it is settled
  const runCheck = useCallback((ref: string) => {
    void checkPayment(ref, () => refresh.current()).then((settled) => {
      if (!settled) return; // not settled yet: the reference stays in the address, so a reload can ask again
      const q = new URLSearchParams(window.location.search);
      if (q.has("reference") || q.has("trxref"))
        changeParams.current({ tab: "billing" }, { replace: true });
    });
  }, []);
  useEffect(() => {
    if (reference) runCheck(reference);
  }, [reference, runCheck]);

  const [pick, setPick] = useState<PlanId | null>(null);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<BillProblem | null>(null);
  const [askCancel, setAskCancel] = useState(false);

  const test = import.meta.env.VITE_PAYMENTS_MODE === "test";
  const plan: PlanId = pick ?? (billing?.plan === "pro" ? "pro" : "basic");
  const option = billing ? optionOf(billing.plans, plan, cycle) : null;
  const canAuto = option?.canSubscribe ?? false;
  const wantAuto = auto && canAuto;
  const s = billing ? standing(billing, now) : null;
  const blocked = billing ? blockedPlan(billing, plan, now) : false;
  const anyBlocked = billing
    ? (["basic", "pro"] as PlanId[]).some((id) => blockedPlan(billing, id, now))
    : false;
  const upgrading =
    billing &&
    s &&
    s.kind === "active" &&
    billing.plan === "basic" &&
    plan === "pro";

  const pay = async () => {
    setError(null);
    setBusy(true);
    try {
      const { url } = await startCheckout(plan, cycle, wantAuto);
      goToCheckout(url); // to Paystack; the person comes back to this screen
    } catch (e) {
      setError(e instanceof BillError ? e.problem : "failed");
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setAskCancel(false);
    try {
      await cancelRenewal();
      toast(t("bill.cancelled"));
      await loadBilling();
    } catch (e) {
      setError(e instanceof BillError ? e.problem : "failed");
    }
  };

  const retry = () => {
    if (back.kind === "waiting" || back.kind === "error")
      runCheck(back.reference);
  };

  return (
    <div className="space-y-5">
      {!online && (
        <Note tone="warn" icon={<WifiOff size={20} />}>
          {t("bill.offline")}
        </Note>
      )}
      {test && (
        <Note tone="warn" icon={<CreditCard size={20} />}>
          {t("bill.test")}
        </Note>
      )}

      <section className="card space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard size={20} className="text-prima-500" /> {t("bill.title")}
        </h2>
        {billing && s ? (
          <>
            <p className="text-3xl font-bold text-prima-500">
              {t(PLAN_NAME[billing.plan])}
            </p>
            <StandingLine b={billing} now={now} />
            {billing.isAdmin && s.kind === "active" && s.renews && (
              <button
                type="button"
                className="min-h-12 font-semibold text-prima-500 underline"
                onClick={() => setAskCancel(true)}
              >
                {t("bill.cancel")}
              </button>
            )}
          </>
        ) : loaded ? (
          problem && <p className="font-medium">{t(PROBLEM[problem])}</p>
        ) : (
          <p
            className="flex items-center gap-2 text-lg font-semibold"
            role="status"
          >
            <Loader size={20} className="animate-spin text-prima-500" />{" "}
            {t("common.loading")}
          </p>
        )}
      </section>

      {back.kind === "verifying" && (
        <p
          className="flex items-center gap-3 text-lg font-semibold"
          role="status"
        >
          <Loader size={22} className="animate-spin text-prima-500" />{" "}
          {t("bill.verifying")}
        </p>
      )}
      {back.kind === "paid" && (
        <Note tone="good" icon={<CircleCheck size={22} />}>
          {t("bill.paid")}
        </Note>
      )}
      {(back.kind === "waiting" || back.kind === "error") && (
        <div className="space-y-3">
          <Note tone="warn" icon={<TriangleAlert size={22} />}>
            {back.kind === "waiting"
              ? t("bill.waiting")
              : t(PROBLEM[back.problem])}
          </Note>
          <button
            type="button"
            className="btn btn-secondary sm:w-56"
            onClick={retry}
          >
            <RefreshCw size={18} className="mr-2" /> {t("bill.checkAgain")}
          </button>
        </div>
      )}
      {back.kind === "notPaid" && (
        <Note tone="warn" icon={<TriangleAlert size={22} />}>
          {t("bill.notPaid")}
        </Note>
      )}
      {back.kind === "refused" && (
        <div className="space-y-3">
          <Note tone="warn" icon={<TriangleAlert size={22} />}>
            {t("bill.refused", { reference: back.reference })}
          </Note>
          <button
            type="button"
            className="min-h-12 font-semibold text-prima-500 underline"
            onClick={dismissReturn}
          >
            {t("common.close")}
          </button>
        </div>
      )}

      {billing && !billing.isAdmin && (
        <p className="rounded-xl bg-page p-3 text-subtext">
          {t("bill.adminOnly")}
        </p>
      )}

      {billing?.isAdmin && (
        <section className="card space-y-4">
          <h3 className="text-lg font-bold">{t("bill.choose")}</h3>

          <div className="flex flex-wrap gap-2" role="group">
            {(["monthly", "annual"] as Cycle[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cycle === c}
                className={`inline-flex min-h-12 items-center rounded-xl border-2 px-5 font-semibold ${cycle === c ? "border-prima-500 bg-prima-500 text-white" : "border-prima-500 bg-white text-prima-500"}`}
                onClick={() => setCycle(c)}
              >
                {t(CYCLE_NAME[c])}
              </button>
            ))}
          </div>
          {cycle === "annual" && yearlySaving(billing.plans, plan) > 0 && (
            <p className="font-medium text-prima-900">
              {t("bill.saving", {
                amount: money(nairaOf(yearlySaving(billing.plans, plan))),
              })}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {(["basic", "pro"] as PlanId[]).map((id) => {
              const o = optionOf(billing.plans, id, cycle);
              const off = blockedPlan(billing, id, now);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={plan === id}
                  disabled={off || !o}
                  className={`card relative space-y-1 text-left ${off ? "opacity-60" : ""}`}
                  // inline, so the choice is clear whatever the card's own border says
                  style={
                    plan === id
                      ? {
                          borderColor: "var(--color-prima-500, #0F766E)",
                          backgroundColor: "var(--color-prima-50, #F0FDFA)",
                          borderWidth: 3,
                        }
                      : undefined
                  }
                  onClick={() => setPick(id)}
                >
                  {plan === id && (
                    <CircleCheck
                      size={22}
                      className="absolute right-3 top-3 text-prima-500"
                      aria-hidden
                    />
                  )}
                  <span className="block text-xl font-bold text-prima-500">
                    {t(PLAN_NAME[id])}
                  </span>
                  {o && (
                    <span className="block text-lg font-semibold">
                      {t(
                        cycle === "monthly" ? "bill.perMonth" : "bill.perYear",
                        { price: money(nairaOf(o.amountKobo)) },
                      )}
                    </span>
                  )}
                  {billing.plan === id &&
                    s &&
                    s.kind !== "free" &&
                    s.kind !== "expired" && (
                      <span className="block text-sm font-semibold text-prima-900">
                        {t("bill.current")}
                      </span>
                    )}
                </button>
              );
            })}
          </div>
          <Link
            to="/plans"
            className="inline-flex min-h-12 items-center font-semibold text-prima-500 underline"
          >
            {t("bill.included")}
          </Link>

          {anyBlocked && s && (s.kind === "active" || s.kind === "pilot") && (
            <p className="font-medium">
              {t("bill.lowerBlocked", { date: date(s.until) })}
            </p>
          )}
          {upgrading && <p className="text-subtext">{t("bill.upgradeNote")}</p>}

          <fieldset className="space-y-2" disabled={blocked}>
            <legend className="font-semibold">{t("bill.how")}</legend>
            <label className="flex min-h-12 items-start gap-3 rounded-xl border-2 border-line p-3">
              <input
                type="radio"
                name="how"
                className="mt-1 h-5 w-5 accent-prima-500"
                checked={!wantAuto}
                onChange={() => setAuto(false)}
              />
              <span>
                <span className="block font-semibold">{t("bill.once")}</span>
                <span className="block text-sm text-subtext">
                  {t("bill.onceHelp")}
                </span>
              </span>
            </label>
            {canAuto && (
              <label className="flex min-h-12 items-start gap-3 rounded-xl border-2 border-line p-3">
                <input
                  type="radio"
                  name="how"
                  className="mt-1 h-5 w-5 accent-prima-500"
                  checked={wantAuto}
                  onChange={() => setAuto(true)}
                />
                <span>
                  <span className="block font-semibold">{t("bill.auto")}</span>
                  <span className="block text-sm text-subtext">
                    {t("bill.autoHelp")}
                  </span>
                </span>
              </label>
            )}
          </fieldset>

          {error && (
            <Note tone="warn" icon={<TriangleAlert size={22} />}>
              {error === "lower_plan" &&
              s &&
              (s.kind === "active" || s.kind === "pilot")
                ? t("bill.lowerBlocked", { date: date(s.until) })
                : t(PROBLEM[error])}
            </Note>
          )}

          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !online || blocked || !option}
            onClick={() => void pay()}
          >
            {busy
              ? t("bill.paying")
              : option
                ? t("bill.pay", { amount: money(nairaOf(option.amountKobo)) })
                : t("bill.choose")}
          </button>
        </section>
      )}

      {billing?.isAdmin && (
        <section className="card space-y-3">
          <h3 className="text-lg font-bold">{t("bill.history")}</h3>
          {billing.payments.length === 0 ? (
            <p className="text-subtext">{t("bill.noPayments")}</p>
          ) : (
            <ul className="space-y-2">
              {billing.payments.map((p) => {
                const o = billing.plans.find((x) => x.code === p.code);
                return (
                  <li
                    key={p.reference}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-line p-3"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {o
                          ? `${t(PLAN_NAME[o.plan])}, ${t(CYCLE_NAME[o.cycle])}`
                          : p.code}
                      </span>
                      <span className="block text-sm text-subtext">
                        {date(Date.parse(p.at))}
                        {p.mode === "renewal"
                          ? ` · ${t("bill.m.renewal")}`
                          : ""}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold">
                        {money(nairaOf(p.amountKobo))}
                      </span>
                      <span
                        className={`block text-sm font-semibold ${p.status === "success" ? "text-ok" : p.status === "failed" ? "text-danger" : "text-subtext"}`}
                      >
                        {t(STATUS[p.status])}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {askCancel && s && s.kind === "active" && (
        <ConfirmDialog
          title={t("bill.cancelTitle")}
          message={t("bill.cancelText", { date: date(s.until) })}
          confirmLabel={t("bill.cancel")}
          onCancel={() => setAskCancel(false)}
          onConfirm={() => void turnOff()}
        />
      )}
    </div>
  );
}
