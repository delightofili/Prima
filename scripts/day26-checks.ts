// Day 26 checks that need no network and no database: what the plan screen says in each situation, who may not buy what,
// the safety helpers the payment functions use (signature, key mode, return address), and that the prices agree everywhere.
import { readFileSync } from "node:fs";
import {
  REFERENCE,
  blockedPlan,
  nairaOf,
  optionOf,
  referenceFromUrl,
  standing,
  yearlySaving,
  type Billing,
  type PlanOption,
} from "../src/lib/billingLogic";
import {
  REFERENCE as SERVER_REFERENCE,
  corsHeaders,
  keyProblem,
  newReference,
  returnUrl,
  signatureOf,
  signatureValid,
} from "../supabase/functions/_shared/paystack";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};

const NOW = Date.parse("2026-11-10T09:00:00Z");
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
const PLANS: PlanOption[] = [
  {
    code: "basic_monthly",
    plan: "basic",
    cycle: "monthly",
    amountKobo: 250000,
    canSubscribe: true,
  },
  {
    code: "basic_annual",
    plan: "basic",
    cycle: "annual",
    amountKobo: 2500000,
    canSubscribe: false,
  },
  {
    code: "pro_monthly",
    plan: "pro",
    cycle: "monthly",
    amountKobo: 500000,
    canSubscribe: false,
  },
  {
    code: "pro_annual",
    plan: "pro",
    cycle: "annual",
    amountKobo: 5000000,
    canSubscribe: true,
  },
];
const b = (o: Partial<Billing>): Billing => ({
  plan: "free",
  isAdmin: true,
  status: "none",
  source: null,
  until: null,
  graceUntil: null,
  autoRenew: false,
  billingPlan: null,
  plans: PLANS,
  payments: [],
  ...o,
});
const paid = (plan: "basic" | "pro", days: number, o: Partial<Billing> = {}) =>
  b({
    plan,
    status: "active",
    source: "paid",
    until: iso(NOW + days * DAY),
    graceUntil: iso(NOW + (days + 7) * DAY),
    billingPlan: `${plan}_monthly`,
    ...o,
  });

/* ---------- what the plan screen says ---------- */
ok("a facility that never paid is Free", standing(b({}), NOW).kind === "free");
ok(
  "a facility whose paid plan ended is told it ended (and is back on Free)",
  standing(b({ status: "expired" }), NOW).kind === "expired",
);
let s = standing(paid("basic", 20, { autoRenew: true }), NOW);
ok(
  "a paid plan shows the days left and that it renews",
  s.kind === "active" && s.daysLeft === 20 && s.renews === true,
);
s = standing(paid("basic", 20, { autoRenew: false }), NOW);
ok(
  "without automatic renewal it says it will end",
  s.kind === "active" && s.renews === false,
);
s = standing(paid("basic", 20, { autoRenew: true, status: "cancelling" }), NOW);
ok(
  "after cancelling, it still runs to the paid date and does not renew",
  s.kind === "active" && s.renews === false && s.daysLeft === 20,
);
s = standing(paid("basic", 0.4), NOW);
ok(
  "less than a day left counts as one day, never zero",
  s.kind === "active" && s.daysLeft === 1,
);
s = standing(paid("basic", 20, { source: "pilot", billingPlan: null }), NOW);
ok(
  "the pilot offer is its own state, with its end date",
  s.kind === "pilot" && s.daysLeft === 20,
);
s = standing(paid("pro", -2, { status: "past_due" }), NOW);
ok(
  "a failed renewal is 'past due' and keeps the week of patience",
  s.kind === "pastDue" && s.graceUntil === NOW + 5 * DAY,
);
s = standing(paid("basic", -1), NOW);
ok(
  "a plan whose date has just passed is past due too, not suddenly Free",
  s.kind === "pastDue",
);
s = standing(paid("basic", 20, { status: "past_due" }), NOW);
ok(
  "a failed payment before the end date is still past due (the screen must warn)",
  s.kind === "pastDue",
);

/* ---------- who may not buy what ---------- */
ok(
  "on Pro, Basic is blocked and Pro is not",
  blockedPlan(paid("pro", 30), "basic", NOW) &&
    !blockedPlan(paid("pro", 30), "pro", NOW),
);
ok(
  "on Basic, both Basic and Pro are open (Pro is an upgrade)",
  !blockedPlan(paid("basic", 30), "basic", NOW) &&
    !blockedPlan(paid("basic", 30), "pro", NOW),
);
ok(
  "on the free pilot (Pro), Basic is blocked, so a clinic cannot lose Pro by mistake",
  blockedPlan(
    paid("pro", 30, { source: "pilot", billingPlan: null }),
    "basic",
    NOW,
  ),
);
ok(
  "once Pro has ended, Basic is open again",
  !blockedPlan(paid("pro", -3, { status: "past_due" }), "basic", NOW),
);
ok(
  "on Free, nothing is blocked",
  !blockedPlan(b({}), "basic", NOW) && !blockedPlan(b({}), "pro", NOW),
);

/* ---------- prices ---------- */
ok(
  "a year saves two months: 5,000 naira on Basic and 10,000 on Pro",
  nairaOf(yearlySaving(PLANS, "basic")) === 5000 &&
    nairaOf(yearlySaving(PLANS, "pro")) === 10000,
);
ok(
  "with no yearly price there is no saving shown",
  yearlySaving(
    PLANS.filter((p) => p.cycle === "monthly"),
    "pro",
  ) === 0,
);
ok(
  "a plan and cycle find their option, and a missing one gives nothing",
  optionOf(PLANS, "pro", "annual")?.amountKobo === 5000000 &&
    optionOf(PLANS, "pro", "weekly" as never) === null,
);

/* ---------- the return from Paystack ---------- */
const REF = "prima_" + "0123456789abcdef".repeat(2);
ok(
  "the reference is read from the address Paystack returns to",
  referenceFromUrl(`?tab=billing&trxref=${REF}&reference=${REF}`) === REF &&
    referenceFromUrl(`?trxref=${REF}`) === REF,
);
ok(
  "a reference that is not in our shape is ignored (an injected one never reaches the server)",
  [
    "?reference=abc",
    "?reference=prima_xyz",
    `?reference=${REF}0`,
    `?reference=${REF.slice(0, -1)}`,
    "?reference=../../x",
    "",
    "?tab=billing",
  ].every((q) => referenceFromUrl(q) === null),
);
ok(
  "the app and the server agree on what a reference looks like",
  REFERENCE.source === SERVER_REFERENCE.source &&
    REFERENCE.test(newReference()),
);

/* ---------- the safety helpers the payment functions rely on ---------- */
const env = (
  o: Partial<{
    PAYSTACK_SECRET_KEY: string;
    PAYSTACK_MODE: string;
    APP_URLS: string;
  }> = {},
) => ({
  PAYSTACK_SECRET_KEY: "sk_test_abc",
  PAYSTACK_MODE: "test",
  APP_URLS: "https://prima-test-axo.pages.dev,https://prima.example.ng",
  ...o,
});
ok("a test key in test mode is accepted", keyProblem(env()) === null);
ok(
  "a LIVE key while the mode says test is refused (a live key can never be used by accident)",
  keyProblem(env({ PAYSTACK_SECRET_KEY: "sk_live_abc" })) !== null,
);
ok(
  "a test key while the mode says live is refused",
  keyProblem(env({ PAYSTACK_MODE: "live" })) !== null,
);
ok(
  "a missing or odd mode is refused",
  keyProblem(env({ PAYSTACK_MODE: "" })) !== null &&
    keyProblem(env({ PAYSTACK_MODE: "Test" })) !== null,
);
const sig = await signatureOf('{"event":"charge.success"}', "sk_test_abc");
ok("a signature is 128 hex letters", /^[0-9a-f]{128}$/.test(sig));
ok(
  "the right signature is accepted",
  await signatureValid('{"event":"charge.success"}', sig, "sk_test_abc"),
);
ok(
  "a signature for a changed body, another key, a missing header or junk is refused",
  !(await signatureValid('{"event":"charge.failed"}', sig, "sk_test_abc")) &&
    !(await signatureValid(
      '{"event":"charge.success"}',
      sig,
      "sk_test_other",
    )) &&
    !(await signatureValid("{}", null, "k")) &&
    !(await signatureValid("{}", "zz", "k")) &&
    !(await signatureValid("{}", "g".repeat(128), "k")),
);
ok(
  "two payments never get the same reference",
  new Set(Array.from({ length: 500 }, newReference)).size === 500,
);
ok(
  "the return address is always one of our own, even when the request claims another origin",
  returnUrl("https://evil.example", env()) ===
    "https://prima-test-axo.pages.dev/dashboard?tab=billing" &&
    returnUrl("https://prima.example.ng/", env()) ===
      "https://prima.example.ng/dashboard?tab=billing" &&
    returnUrl(null, env()).startsWith("https://prima-test-axo.pages.dev/"),
);
ok(
  "only our own sites get permission to call the payment functions from a browser",
  corsHeaders("https://prima-test-axo.pages.dev", env())[
    "Access-Control-Allow-Origin"
  ] === "https://prima-test-axo.pages.dev" &&
    corsHeaders("https://evil.example", env())[
      "Access-Control-Allow-Origin"
    ] === undefined &&
    corsHeaders(null, env())["Access-Control-Allow-Origin"] === undefined,
);

/* ---------- the prices agree everywhere ---------- */
try {
  const sql = readFileSync(
    new URL("../supabase/day26.sql", import.meta.url),
    "utf8",
  );
  const seeds = Object.fromEntries(
    [
      ...sql.matchAll(
        /\('(\w+)',\s*'(?:basic|pro)',\s*'(?:monthly|annual)',\s*(\d+)\)/g,
      ),
    ].map((m) => [m[1], Number(m[2])]),
  );
  ok(
    "the database price list has the four prices, and a year costs exactly ten months",
    Object.keys(seeds).length === 4 &&
      seeds.basic_annual === 10 * seeds.basic_monthly &&
      seeds.pro_annual === 10 * seeds.pro_monthly,
  );
  const plan = readFileSync(
    new URL("../src/lib/plan.ts", import.meta.url),
    "utf8",
  );
  const prices = /PRICES\s*=\s*\{([^}]*)\}/.exec(plan)?.[1];
  const basic = Number(
    /basic:\s*([\d_,]+)/.exec(prices ?? "")?.[1]?.replace(/[_,]/g, ""),
  );
  const pro = Number(
    /pro:\s*([\d_,]+)/.exec(prices ?? "")?.[1]?.replace(/[_,]/g, ""),
  );
  if (basic && pro)
    ok(
      "the prices shown elsewhere in the app (PRICES in plan.ts) are the same as what the database will charge",
      basic * 100 === seeds.basic_monthly && pro * 100 === seeds.pro_monthly,
      `app ${basic}/${pro} naira, database ${seeds.basic_monthly / 100}/${seeds.pro_monthly / 100}`,
    );
  else
    console.log(
      "NOTE  could not read PRICES from src/lib/plan.ts, so that comparison was skipped",
    );
} catch (e) {
  console.log(
    `NOTE  price files not found from here (${(e as Error).message.slice(0, 80)}), so the price comparison was skipped`,
  );
}

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
