// Everything that talks to Paystack, and the small checks around it. It uses only what Deno (Supabase Edge Functions)
// and Node both have, so the same code is tested on a computer and runs in the cloud.

export interface Env {
  PAYSTACK_SECRET_KEY: string; // sk_test_... while testing, sk_live_... later. Set with `supabase secrets set`, never in the app.
  PAYSTACK_MODE: string; // "test" or "live": the key must match, so a live key can never be used by accident
  APP_URLS: string; // the addresses the app runs on, separated by commas; the first one is the default
}

export interface Deps {
  env: Env;
  fetch: typeof fetch;
  // Calls a database function as the server (the service role). The argument names are the function's parameter names.
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  userFromJwt(
    jwt: string,
  ): Promise<{ id: string; email: string | null } | null>;
}

const API = "https://api.paystack.co";

// Reads a value inside Paystack's answer, giving undefined when any step is missing (instead of an error)
export function dig(value: unknown, ...path: string[]): unknown {
  let v: unknown = value;
  for (const key of path) {
    if (typeof v !== "object" || v === null) return undefined;
    v = (v as Record<string, unknown>)[key];
  }
  return v;
}
const enc = new TextEncoder();

export const keyProblem = (env: Env): string | null => {
  const want =
    env.PAYSTACK_MODE === "live"
      ? "sk_live_"
      : env.PAYSTACK_MODE === "test"
        ? "sk_test_"
        : null;
  if (!want) return "PAYSTACK_MODE must be test or live";
  if (!env.PAYSTACK_SECRET_KEY.startsWith(want))
    return `PAYSTACK_MODE is ${env.PAYSTACK_MODE} but the key is not a ${want} key`;
  return null;
};

/* ---------- small helpers ---------- */

export function newReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return (
    "prima_" +
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  );
}
export const REFERENCE = /^prima_[0-9a-f]{32}$/;

export function corsHeaders(
  origin: string | null,
  env: Env,
): Record<string, string> {
  const allowed = env.APP_URLS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin))
    h["Access-Control-Allow-Origin"] = origin;
  return h;
}

// Where Paystack sends the person back to: only ever one of our own addresses
export function returnUrl(origin: string | null, env: Env): string {
  const allowed = env.APP_URLS.split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const base =
    origin && allowed.includes(origin.replace(/\/+$/, ""))
      ? origin.replace(/\/+$/, "")
      : allowed[0];
  return `${base}/dashboard?tab=billing`;
}

export const json = (
  status: number,
  body: unknown,
  extra: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

/* ---------- is this really from Paystack? ---------- */

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

// Paystack signs the exact body it sends with HMAC SHA-512 and your secret key
export async function signatureOf(
  rawBody: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(rawBody)));
}

// Compares without stopping at the first difference, so a guess cannot be improved letter by letter
export async function signatureValid(
  rawBody: string,
  header: string | null,
  secret: string,
): Promise<boolean> {
  if (!header || header.length !== 128 || !/^[0-9a-f]+$/.test(header))
    return false;
  const expected = await signatureOf(rawBody, secret);
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

/* ---------- Paystack calls ---------- */

async function call(
  deps: Deps,
  path: string,
  init: { method: string; body?: unknown },
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await deps.fetch(API + path, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${deps.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const data: unknown = await res.json().catch(() => null);
    return {
      ok: res.ok && dig(data, "status") === true,
      status: res.status,
      data,
    };
  } catch {
    return { ok: false, status: 0, data: null }; // no connection to Paystack
  }
}

export async function initTransaction(
  deps: Deps,
  p: {
    email: string;
    amountKobo: number;
    reference: string;
    callbackUrl: string;
    planCode: string | null;
    facilityId: string;
  },
) {
  const r = await call(deps, "/transaction/initialize", {
    method: "POST",
    body: {
      email: p.email,
      amount: p.amountKobo, // for a subscription Paystack uses the plan's own price: we check it matches when we verify
      currency: "NGN",
      reference: p.reference,
      callback_url: p.callbackUrl,
      metadata: { app: "prima", facility_id: p.facilityId },
      ...(p.planCode ? { plan: p.planCode } : {}),
    },
  });
  const url = dig(r.data, "data", "authorization_url");
  if (
    !r.ok ||
    typeof url !== "string" ||
    !url.startsWith("https://checkout.paystack.com/")
  )
    return null;
  return {
    url,
    reference: String(dig(r.data, "data", "reference") ?? p.reference),
  };
}

export interface Verified {
  reference: string;
  status: string; // success, abandoned, failed, pending...
  amountKobo: number | null;
  currency: string | null;
  id: number | null;
  paidAt: string | null;
  customerCode: string | null;
  planCode: string | null;
  app: string | null;
}

// Asks Paystack itself. What the phone or the webhook body claims is never trusted for money.
export async function verifyTransaction(
  deps: Deps,
  reference: string,
): Promise<Verified | null> {
  const r = await call(
    deps,
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
  const d = dig(r.data, "data");
  if (!r.ok || !d) return null;
  const text = (...path: string[]) => {
    const v = dig(d, ...path);
    return typeof v === "string" ? v : null;
  };
  const whole = (...path: string[]) => {
    const v = dig(d, ...path);
    return typeof v === "number" && Number.isInteger(v) ? v : null;
  };
  return {
    reference: text("reference") ?? "",
    status: text("status") ?? "",
    amountKobo: whole("amount"),
    currency: text("currency"),
    id: whole("id"),
    paidAt: text("paid_at"),
    customerCode: text("customer", "customer_code"),
    // Paystack gives the plan as an object, as "plan_object", or as a plain code: any of them is read
    planCode:
      text("plan", "plan_code") ??
      text("plan_object", "plan_code") ??
      (text("plan")?.startsWith("PLN_") ? text("plan") : null),
    app: text("metadata", "app"),
  };
}

export async function disableSubscription(
  deps: Deps,
  code: string,
  token: string,
): Promise<boolean> {
  return (
    await call(deps, "/subscription/disable", {
      method: "POST",
      body: { code, token },
    })
  ).ok;
}
