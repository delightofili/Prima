// The app's side of paying. It never decides a price and never decides that something was paid: it asks the server to
// open a payment, sends the person to Paystack, and then asks the server to confirm what Paystack says.
import {
  REFERENCE,
  type Billing,
  type Confirmed,
  type Cycle,
  type PlanId,
} from "./billingLogic";
import { supabase } from "./supabase";
import { classify } from "./syncErrors";

export * from "./billingLogic";

/* ---------- what can go wrong, in words the screen can explain ---------- */

export type BillProblem =
  | "offline"
  | "signin"
  | "not_admin"
  | "lower_plan"
  | "no_autorenew"
  | "no_email"
  | "paystack"
  | "no_subscription"
  | "amount"
  | "currency"
  | "plan"
  | "failed_before"
  | "mismatch"
  | "unknown_reference"
  | "misconfigured"
  | "server"
  | "failed";

const KNOWN: BillProblem[] = [
  "signin",
  "not_admin",
  "lower_plan",
  "no_autorenew",
  "no_email",
  "paystack",
  "no_subscription",
  "amount",
  "currency",
  "plan",
  "failed_before",
  "mismatch",
  "unknown_reference",
  "misconfigured",
  "server",
];

export class BillError extends Error {
  problem: BillProblem;
  constructor(problem: BillProblem) {
    super(`billing: ${problem}`);
    this.name = "BillError";
    this.problem = problem;
  }
}

// Calls one of the server functions and turns every failure into a BillProblem
async function callFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  let data: unknown;
  let error: { name?: string; context?: Response } | null;
  try {
    ({ data, error } = (await supabase.functions.invoke(name, { body })) as {
      data: unknown;
      error: typeof error;
    });
  } catch (e) {
    throw new BillError(classify(e) === "network" ? "offline" : "failed");
  }
  if (error) {
    if (error.name === "FunctionsFetchError") throw new BillError("offline"); // the request never reached the server
    let code = "failed";
    try {
      code = String(
        ((await error.context?.json()) as { error?: unknown } | undefined)
          ?.error ?? "failed",
      );
    } catch {
      /* the server gave no readable reason */
    }
    throw new BillError(
      (KNOWN as string[]).includes(code) ? (code as BillProblem) : "failed",
    );
  }
  return data as T;
}

/* ---------- reading the state ---------- */

export async function fetchBilling(): Promise<Billing> {
  try {
    const { data, error } = await supabase.rpc("get_billing");
    if (error) throw error;
    return data as Billing;
  } catch (e) {
    const kind = classify(e);
    throw new BillError(
      kind === "network"
        ? "offline"
        : kind === "schema"
          ? "misconfigured"
          : kind === "auth"
            ? "signin"
            : "failed",
    );
  }
}

/* ---------- paying ---------- */

const PENDING = "prima_pending_payment";

// The reference is kept on the phone while the person is at Paystack, so the payment can be confirmed when they come back
export const rememberPending = (reference: string) => {
  try {
    localStorage.setItem(PENDING, reference);
  } catch {
    /* storage unavailable: the address Paystack returns to carries the reference too */
  }
};
export const readPending = (): string | null => {
  try {
    const v = localStorage.getItem(PENDING);
    return v && REFERENCE.test(v) ? v : null;
  } catch {
    return null;
  }
};
export const clearPending = () => {
  try {
    localStorage.removeItem(PENDING);
  } catch {
    /* nothing to clear */
  }
};

// Sending the person to Paystack goes through one function, so a test can see where they would be sent without leaving the page
let navigate: (url: string) => void = (url) => window.location.assign(url);
export const goToCheckout = (url: string) => navigate(url);
export const setNavigator = (fn: (url: string) => void) => {
  navigate = fn;
};

export async function startCheckout(
  plan: PlanId,
  cycle: Cycle,
  autoRenew: boolean,
): Promise<{ url: string; reference: string }> {
  const r = await callFunction<{ url: string; reference: string }>(
    "paystack-init",
    { plan, cycle, autoRenew },
  );
  if (
    typeof r?.url !== "string" ||
    !r.url.startsWith("https://checkout.paystack.com/") ||
    !REFERENCE.test(r.reference)
  )
    throw new BillError("failed");
  rememberPending(r.reference);
  return r;
}

export async function confirmPayment(reference: string): Promise<Confirmed> {
  const r = await callFunction<{
    paid: boolean;
    status?: string;
    plan?: string | null;
    until?: string | null;
  }>("paystack-verify", { reference });
  return r.paid
    ? { paid: true, plan: r.plan ?? null, until: r.until ?? null }
    : { paid: false, status: r.status ?? "unknown" };
}

export async function cancelRenewal(): Promise<void> {
  await callFunction<{ ok: boolean }>("paystack-cancel", {});
}
