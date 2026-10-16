export type Plan = "free" | "basic" | "pro";
export type Feature =
  | "followUps"
  | "csvExport"
  | "lgaReport"
  | "unlimitedPatients"
  | "duplicateMerge"
  | "smsReminders";

export const PLAN_EVENT = "prima-plan";
export const FREE_PATIENT_LIMIT = 200;
export const LIMIT_WARNING = 180;

const KEY = "prima_plan";
const RANK: Record<Plan, number> = { free: 0, basic: 1, pro: 2 };
const MIN_PLAN: Record<Feature, Plan> = {
  followUps: "pro",
  csvExport: "basic",
  lgaReport: "basic",
  unlimitedPatients: "basic",
  duplicateMerge: "pro",
  smsReminders: "pro",
};

export const PRICES = { basic: 2500, pro: 5000 } as const;
export const money = (n: number) => `₦${n.toLocaleString("en-NG")}`;

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

export class PlanLimitError extends Error {
  constructor() {
    super(`The Free plan is limited to ${FREE_PATIENT_LIMIT} patients.`);
    this.name = "PlanLimitError";
  }
}

export function getPlan(): Plan {
  try {
    const v = localStorage.getItem(KEY);
    return v === "basic" || v === "pro" ? v : "free";
  } catch {
    return "free";
  }
}

export function setPlan(plan: Plan) {
  try {
    localStorage.setItem(KEY, plan);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(PLAN_EVENT));
}

export const canUse = (plan: Plan, feature: Feature) =>
  RANK[plan] >= RANK[MIN_PLAN[feature]];
