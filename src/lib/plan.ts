//FREE_PATIENT_LIMIT: // Mirrors the database function patient_limit();

import type { Key } from "../i18n";
import { getCurrentFacility } from "./config";

export type Plan = "free" | "basic" | "pro";
export type Feature =
  | "followUps"
  | "csvExport"
  | "lgaReport"
  | "unlimitedPatients"
  | "duplicateMerge"
  | "smsReminders"
  | "fhirExport"
  | "dhis2Export";

export const PLAN_EVENT = "prima-plan";
export const FREE_PATIENT_LIMIT = 200;
export const LIMIT_WARNING = 180;

const KEY = "prima_plan";
const RANK: Record<Plan, number> = { free: 0, basic: 1, pro: 2 };
const MIN_PLAN: Record<Feature, Plan> = {
  followUps: "pro",
  csvExport: "basic",
  lgaReport: "basic",
  unlimitedPatients: "free",
  duplicateMerge: "pro",
  smsReminders: "pro",
  fhirExport: "pro",
  dhis2Export: "pro",
};

export const PRICES = { basic: 2500, pro: 5000 } as const;
export const money = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// What each plan includes, in English, for the screens that are not translated yet (the upgrade window)
export const PLANS: {
  id: Plan;
  name: string;
  price: string;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    price: "₦0",
    features: [
      "1 facility",
      "Up to 200 patients",
      "Registration, visits and offline use",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: money(PRICES.basic),
    features: [
      "Unlimited patients",
      "CSV export and LGA report",
      "Installable app (PWA)",
      "Up to 3 staff",
      "Offline sync across devices",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: money(PRICES.pro),
    features: [
      "Everything in Basic",
      "Follow-up due list",
      "FHIR and DHIS2 export",
      "Smart duplicate merge",
      "SMS reminder queue (sending coming soon)",
    ],
  },
];

// The same lists as dictionary keys, so the Plans page and the plan card speak the person's language.
// Keep it in step with PLANS above: scripts/day27-plans-checks.ts fails if the two ever differ in length or a key is missing.
export const PLAN_NAME_KEY: Record<Plan, Key> = {
  free: "bill.free",
  basic: "bill.basic",
  pro: "bill.pro",
};
export const PLAN_FEATURES: Record<Plan, Key[]> = {
  free: ["plans.f.free1", "plans.f.free2", "plans.f.free3"],
  basic: [
    "plans.f.basic1",
    "plans.f.basic2",
    "plans.f.basic3",
    "plans.f.basic4",
    "plans.f.basic5",
  ],
  pro: [
    "plans.f.pro1",
    "plans.f.pro2",
    "plans.f.pro3",
    "plans.f.pro4",
    "plans.f.pro5",
  ],
};

export class PlanLimitError extends Error {
  constructor() {
    super(`The Free plan is limited to ${FREE_PATIENT_LIMIT} patients.`);
    this.name = "PlanLimitError";
  }
}

export function planOverride(): Plan | null {
  if (!import.meta.env.DEV) return null;
  try {
    const v = localStorage.getItem(KEY);
    return v === "free" || v === "basic" || v === "pro" ? v : null;
  } catch {
    return null;
  }
}

export const getPlan = (): Plan =>
  planOverride() ?? getCurrentFacility()?.plan ?? "free";

export function setPlan(plan: Plan) {
  if (!import.meta.env.DEV) return; // testing only
  try {
    localStorage.setItem(KEY, plan);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(PLAN_EVENT));
}

export function clearPlanOverride() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(PLAN_EVENT));
}

export const canUse = (plan: Plan, feature: Feature) =>
  RANK[plan] >= RANK[MIN_PLAN[feature]];

// Near the Free limit and past it: used to tell the person what is true, never to lock the form
export const spotsLeft = (plan: Plan, active: number): number | null =>
  plan === "free" ? Math.max(0, FREE_PATIENT_LIMIT - active) : null;
export const isOverPlan = (plan: Plan, active: number) =>
  plan === "free" && active >= FREE_PATIENT_LIMIT;
export const isNearLimit = (plan: Plan, active: number) =>
  plan === "free" && active >= LIMIT_WARNING && active < FREE_PATIENT_LIMIT;
