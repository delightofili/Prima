// The four server functions of Day 26. Each takes the request and its tools (Deps) and returns a response, so they can be
// tested on a computer with a pretend Paystack and a real database, and then run unchanged in Supabase.
//
//   init     an admin asks to pay: the SERVER picks the price, opens the payment with Paystack, and hands back a link
//   verify   the admin comes back from Paystack: the SERVER asks Paystack whether it was paid, and for how much
//   webhook  Paystack tells the server on its own (signed): the same checks, for when the admin closed the page
//   cancel   an admin turns automatic renewal off
import {
  REFERENCE,
  corsHeaders,
  dig,
  disableSubscription,
  initTransaction,
  json,
  keyProblem,
  newReference,
  returnUrl,
  signatureValid,
  verifyTransaction,
  type Deps,
} from "./paystack.ts";

type Cors = Record<string, string>;
const PLANS = ["basic", "pro"];
const CYCLES = ["monthly", "annual"];

// The database says "billing:lower_plan" and so on; these become answers the app can explain in the person's language
const KNOWN: Record<string, [number, string]> = {
  not_admin: [403, "not_admin"],
  lower_plan: [409, "lower_plan"],
  no_autorenew: [409, "no_autorenew"],
  bad_plan: [400, "bad_plan"],
  no_subscription: [404, "no_subscription"],
};

function fromDbError(message: string, cors: Cors): Response {
  const code = /billing:([a-z_]+)/.exec(message)?.[1];
  if (code && KNOWN[code])
    return json(KNOWN[code][0], { error: KNOWN[code][1] }, cors);
  console.error("database error:", message.slice(0, 200));
  return json(500, { error: "server" }, cors);
}

type Started =
  | { done: Response }
  | {
      cors: Cors;
      user: { id: string; email: string | null };
      body: Record<string, unknown>;
      origin: string | null;
    };

// What every call from the app needs first: the right method, a safe setup, a signed-in person and a readable body
async function start(req: Request, deps: Deps): Promise<Started> {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin, deps.env);
  if (req.method === "OPTIONS")
    return { done: new Response(null, { status: 204, headers: cors }) };
  if (req.method !== "POST")
    return { done: json(405, { error: "method" }, cors) };
  const problem = keyProblem(deps.env);
  if (problem) {
    console.error("payments are not set up safely:", problem);
    return { done: json(500, { error: "misconfigured" }, cors) };
  }
  const jwt = /^Bearer (.+)$/i.exec(
    req.headers.get("authorization") ?? "",
  )?.[1];
  const user = jwt ? await deps.userFromJwt(jwt) : null;
  if (!user) return { done: json(401, { error: "signin" }, cors) };
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return { done: json(400, { error: "bad_request" }, cors) };
  }
  return { cors, user, body, origin };
}

/* ---------- 1. an admin asks to pay ---------- */

export async function handleInit(req: Request, deps: Deps): Promise<Response> {
  const s = await start(req, deps);
  if ("done" in s) return s.done;
  const { plan, cycle, autoRenew } = s.body;
  // Only a plan name and a cycle are accepted. An amount sent by the app (if any) is not even read.
  if (
    typeof plan !== "string" ||
    !PLANS.includes(plan) ||
    typeof cycle !== "string" ||
    !CYCLES.includes(cycle) ||
    (autoRenew !== undefined && typeof autoRenew !== "boolean")
  ) {
    return json(400, { error: "bad_request" }, s.cors);
  }
  const reference = newReference();
  const { data, error } = await deps.rpc("begin_payment", {
    p_user: s.user.id,
    p_code: `${plan}_${cycle}`,
    p_mode: autoRenew ? "subscribe" : "once",
    p_reference: reference,
  });
  if (error) return fromDbError(error.message, s.cors);
  const d = data as {
    facilityId: string;
    amountKobo: number;
    paystackPlanCode: string | null;
    email: string | null;
  };
  const email = d.email ?? s.user.email;
  if (!email) return json(409, { error: "no_email" }, s.cors);
  const started = await initTransaction(deps, {
    email,
    amountKobo: d.amountKobo,
    reference,
    callbackUrl: returnUrl(s.origin, deps.env),
    planCode: d.paystackPlanCode,
    facilityId: d.facilityId,
  });
  if (!started) {
    console.error("Paystack would not open the payment:", reference);
    return json(502, { error: "paystack" }, s.cors);
  }
  return json(200, { reference, url: started.url }, s.cors);
}

/* ---------- 2. the admin comes back from Paystack ---------- */

export async function handleVerify(
  req: Request,
  deps: Deps,
): Promise<Response> {
  const s = await start(req, deps);
  if ("done" in s) return s.done;
  const reference =
    typeof s.body.reference === "string" ? s.body.reference : "";
  if (!REFERENCE.test(reference))
    return json(400, { error: "bad_request" }, s.cors);
  const v = await verifyTransaction(deps, reference);
  if (!v) return json(502, { error: "paystack" }, s.cors); // could not ask: nothing was decided, the app can ask again
  if (v.reference !== reference) {
    console.error("Paystack answered about a different payment:", reference);
    return json(409, { error: "mismatch" }, s.cors);
  }
  if (v.status !== "success")
    return json(200, { paid: false, status: v.status }, s.cors); // abandoned, failed, still waiting
  const { data, error } = await deps.rpc("apply_payment", {
    p_reference: reference,
    p_amount_kobo: v.amountKobo,
    p_currency: v.currency,
    p_paystack_id: v.id,
    p_paid_at: v.paidAt,
    p_customer_code: v.customerCode,
    p_plan_code: v.planCode,
  });
  if (error) return fromDbError(error.message, s.cors);
  const r = data as {
    ok: boolean;
    reason?: string;
    already?: boolean;
    applied?: boolean;
    plan?: string;
    until?: string;
  };
  if (!r.ok) {
    console.error("a payment was paid but refused:", reference, r.reason); // someone must look: money moved and no plan was given
    return json(409, { paid: false, error: r.reason ?? "refused" }, s.cors);
  }
  return json(
    200,
    {
      paid: true,
      applied: r.applied !== false,
      already: !!r.already,
      plan: r.plan ?? null,
      until: r.until ?? null,
    },
    s.cors,
  );
}

/* ---------- 3. Paystack tells us itself ---------- */

const ok = () => json(200, { ok: true });
const retry = (why: string) => json(500, { error: why }); // anything but 200 makes Paystack send the event again, for up to 72 hours

export async function handleWebhook(
  req: Request,
  deps: Deps,
): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "method" });
  const problem = keyProblem(deps.env);
  if (problem) {
    console.error("payments are not set up safely:", problem);
    return json(500, { error: "misconfigured" });
  }
  const raw = await req.text();
  if (
    !(await signatureValid(
      raw,
      req.headers.get("x-paystack-signature"),
      deps.env.PAYSTACK_SECRET_KEY,
    ))
  )
    return json(401, { error: "signature" });
  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return json(400, { error: "bad_request" });
  }
  const data = dig(event, "data") ?? {};
  const str = (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length < 200 ? v : null;

  try {
    switch (dig(event, "event")) {
      case "charge.success": {
        const reference = str(dig(data, "reference"));
        if (!reference) return ok();
        // The body of the event is not trusted for money either: ask Paystack, as the app's own return does
        const v = await verifyTransaction(deps, reference);
        if (!v) return retry("verify");
        if (v.status !== "success") return ok();
        const args = {
          p_reference: reference,
          p_amount_kobo: v.amountKobo,
          p_currency: v.currency,
          p_paystack_id: v.id,
          p_paid_at: v.paidAt,
        };
        const first = await deps.rpc("apply_payment", {
          ...args,
          p_customer_code: v.customerCode,
          p_plan_code: v.planCode,
        });
        if (first.error) return retry("db");
        const r = first.data as { ok: boolean; reason?: string };
        if (r.ok) return ok();
        if (r.reason !== "unknown_reference") {
          console.error("a payment was paid but refused:", reference, r.reason);
          return ok(); // asking again would give the same answer
        }
        // Not a payment we started: a subscription renewing by itself (it has a plan), or something else on the same Paystack account
        if (v.planCode && v.customerCode) {
          const ren = await deps.rpc("apply_renewal", {
            p_customer_code: v.customerCode,
            p_plan_code: v.planCode,
            p_reference: reference,
            p_amount_kobo: v.amountKobo,
            p_currency: v.currency,
            p_paystack_id: v.id,
            p_paid_at: v.paidAt,
          });
          if (ren.error) return retry("db");
          const rr = ren.data as { ok: boolean; reason?: string };
          if (rr.ok) return ok();
          if (rr.reason === "unknown_customer") return retry("order"); // the first payment has not been applied yet: try again later
          console.error(
            "a renewal was paid but refused:",
            reference,
            rr.reason,
          );
          return ok();
        }
        if (v.app === "prima")
          console.error("a Prima payment has no record:", reference);
        return ok();
      }

      case "subscription.create": {
        const customer = str(dig(data, "customer", "customer_code"));
        const code = str(dig(data, "subscription_code"));
        const token = str(dig(data, "email_token"));
        if (!customer || !code || !token) return ok();
        const res = await deps.rpc("note_subscription", {
          p_customer_code: customer,
          p_subscription_code: code,
          p_email_token: token,
        });
        if (res.error) return retry("db");
        return (res.data as { ok: boolean }).ok ? ok() : retry("order"); // it can arrive before the payment: Paystack will send it again
      }

      case "invoice.payment_failed": {
        const customer = str(dig(data, "customer", "customer_code"));
        if (customer) {
          const res = await deps.rpc("mark_past_due", {
            p_customer_code: customer,
          });
          if (res.error) return retry("db");
        }
        return ok();
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const code = str(dig(data, "subscription_code"));
        if (code) {
          const res = await deps.rpc("mark_cancelling", {
            p_subscription_code: code,
          });
          if (res.error) return retry("db");
        }
        return ok();
      }

      default:
        return ok(); // events we do not use
    }
  } catch (e) {
    console.error("webhook failed:", (e as Error).message);
    return retry("server");
  }
}

/* ---------- 4. an admin turns automatic renewal off ---------- */

export async function handleCancel(
  req: Request,
  deps: Deps,
): Promise<Response> {
  const s = await start(req, deps);
  if ("done" in s) return s.done;
  const target = await deps.rpc("get_cancel_target", { p_user: s.user.id });
  if (target.error) return fromDbError(target.error.message, s.cors);
  const { code, token } = target.data as { code: string; token: string };
  if (!(await disableSubscription(deps, code, token))) {
    console.error("Paystack would not cancel the subscription:", code);
    return json(502, { error: "paystack" }, s.cors);
  }
  const res = await deps.rpc("mark_cancelling", { p_subscription_code: code });
  if (res.error) return fromDbError(res.error.message, s.cors);
  return json(200, { ok: true }, s.cors);
}
