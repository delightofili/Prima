export type Plan = "free" | "basic" | "pro";
export type Feature = "followUps";

export const PLAN_EVENT = "prima-plan";
const KEY = "prima_plan";
const RANK: Record<Plan, number> = { free: 0, basic: 1, pro: 2 };
const MIN_PLAN: Record<Feature, Plan> = { followUps: "pro" };

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
    price: "₦500",
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
    price: "₦900",
    features: [
      "Everything in Basic",
      "Follow-up due list",
      "FHIR and DHIS2 export",
      "Smart duplicate merge",
    ],
  },
];

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
