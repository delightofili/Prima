// The decisions behind the plan screen, with nothing in it that touches the network, so they can be tested on their own.
import { FREE_PATIENT_LIMIT } from "./plan";

export type PlanId = "basic" | "pro";
export type Cycle = "monthly" | "annual";
export type PlanName = "free" | PlanId;

export interface PlanOption {
  code: string; // basic_monthly ...
  plan: PlanId;
  cycle: Cycle;
  amountKobo: number;
  canSubscribe: boolean; // automatic renewal is available for this one
}

export interface PaymentRow {
  at: string;
  reference: string;
  code: string;
  amountKobo: number;
  status: "pending" | "success" | "failed";
  mode: "once" | "subscribe" | "renewal";
  periodEnd: string | null;
}

export interface Billing {
  plan: PlanName;
  isAdmin: boolean;
  status: "none" | "active" | "past_due" | "cancelling" | "expired";
  source: "paid" | "pilot" | null;
  until: string | null;
  graceUntil: string | null;
  autoRenew: boolean;
  billingPlan: string | null;
  plans: PlanOption[];
  payments: PaymentRow[];
}

export { FREE_PATIENT_LIMIT };

export type Confirmed =
  | { paid: true; plan: string | null; until: string | null }
  | { paid: false; status: string };

export const REFERENCE = /^prima_[0-9a-f]{32}$/;

// Paystack sends the person back with ?reference=...&trxref=...
export function referenceFromUrl(search: string): string | null {
  const p = new URLSearchParams(search);
  const r = p.get("reference") ?? p.get("trxref");
  return r && REFERENCE.test(r) ? r : null;
}

/* ---------- reading the state: what to say, decided in one place ---------- */

const DAY = 86_400_000;

export type Standing =
  | { kind: "free" }
  | { kind: "pilot"; until: number; daysLeft: number }
  | { kind: "active"; until: number; daysLeft: number; renews: boolean }
  | { kind: "pastDue"; until: number; graceUntil: number }
  | { kind: "expired" };

export function standing(b: Billing, now: number): Standing {
  if (b.plan === "free")
    return b.status === "expired" ? { kind: "expired" } : { kind: "free" };
  const until = b.until ? Date.parse(b.until) : 0;
  if (b.status === "past_due" || until <= now)
    return {
      kind: "pastDue",
      until,
      graceUntil: b.graceUntil ? Date.parse(b.graceUntil) : until,
    };
  const daysLeft = Math.max(1, Math.ceil((until - now) / DAY));
  if (b.source === "pilot") return { kind: "pilot", until, daysLeft };
  return {
    kind: "active",
    until,
    daysLeft,
    renews: b.autoRenew && b.status !== "cancelling",
  };
}

const RANK: Record<PlanName, number> = { free: 0, basic: 1, pro: 2 };

// While a higher plan is running, a lower one cannot be bought (it would lose features): this says which are blocked
export function blockedPlan(b: Billing, plan: PlanId, now: number): boolean {
  const s = standing(b, now);
  return (
    (s.kind === "active" || s.kind === "pilot") && RANK[plan] < RANK[b.plan]
  );
}

// Two months free on a year: how much is saved against twelve months
export function yearlySaving(plans: PlanOption[], plan: PlanId): number {
  const m = plans.find((p) => p.plan === plan && p.cycle === "monthly");
  const a = plans.find((p) => p.plan === plan && p.cycle === "annual");
  return m && a ? Math.max(0, 12 * m.amountKobo - a.amountKobo) : 0;
}

export const optionOf = (plans: PlanOption[], plan: PlanId, cycle: Cycle) =>
  plans.find((p) => p.plan === plan && p.cycle === cycle) ?? null;
export const nairaOf = (kobo: number) => kobo / 100;
