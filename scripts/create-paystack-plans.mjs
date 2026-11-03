// Creates the four Prima plans in Paystack (needed only for automatic renewal) and prints the SQL that connects them.
// Run it once per Paystack mode: in test mode now, and again in live mode when you go live (the plan codes are different).
//
//   PAYSTACK_SECRET_KEY=sk_test_xxxx node scripts/create-paystack-plans.mjs
//   PAYSTACK_SECRET_KEY=sk_test_xxxx node scripts/create-paystack-plans.mjs --dry-run     (shows what it would do)
//
// The prices are read from supabase/day26.sql, so Paystack and the database can never disagree.
import { readFileSync } from "node:fs";

const KEY = process.env.PAYSTACK_SECRET_KEY ?? "";
const BASE = (
  process.env.PAYSTACK_API_BASE ?? "https://api.paystack.co"
).replace(/\/+$/, "");
const DRY = process.argv.includes("--dry-run");

if (!/^sk_(test|live)_/.test(KEY)) {
  console.error(
    "Set PAYSTACK_SECRET_KEY to your Paystack secret key (it starts with sk_test_ or sk_live_).",
  );
  process.exit(1);
}
console.log(
  `Mode: ${KEY.startsWith("sk_live_") ? "LIVE (real money)" : "test"}${DRY ? ", dry run" : ""}\n`,
);

// supabase/day26.sql holds the one price list
const sql = readFileSync(
  new URL("../supabase/day26.sql", import.meta.url),
  "utf8",
);
const seeds = [
  ...sql.matchAll(
    /\('(\w+)',\s*'(basic|pro)',\s*'(monthly|annual)',\s*(\d+)\)/g,
  ),
].map((m) => ({ code: m[1], plan: m[2], cycle: m[3], amount: Number(m[4]) }));
if (seeds.length !== 4) {
  console.error(
    `Expected 4 prices in supabase/day26.sql, found ${seeds.length}.`,
  );
  process.exit(1);
}

const name = (s) =>
  `Prima ${s.plan === "pro" ? "Pro" : "Basic"} (${s.cycle === "annual" ? "yearly" : "monthly"})`;
const interval = (s) => (s.cycle === "annual" ? "annually" : "monthly");

async function api(path, init = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.status)
    throw new Error(
      `Paystack said no to ${path}: ${data?.message ?? res.status}`,
    );
  return data;
}

async function main() {
  // A plan that already exists (same name, price and interval) is reused, so running this twice does not make duplicates
  const existing = DRY ? [] : ((await api("/plan?perPage=200")).data ?? []);
  const lines = [];
  for (const s of seeds) {
    const found = existing.find(
      (p) =>
        p.name === name(s) &&
        p.amount === s.amount &&
        p.interval === interval(s),
    );
    let code;
    if (found) {
      code = found.plan_code;
      console.log(`${s.code}: already exists (${code})`);
    } else if (DRY) {
      code = "PLN_would_be_created";
      console.log(
        `${s.code}: would create "${name(s)}", ${s.amount / 100} naira, ${interval(s)}`,
      );
    } else {
      code = (
        await api("/plan", {
          method: "POST",
          body: JSON.stringify({
            name: name(s),
            amount: s.amount,
            interval: interval(s),
            currency: "NGN",
          }),
        })
      ).data.plan_code;
      console.log(`${s.code}: created (${code})`);
    }
    lines.push(
      `update public.billing_plans set paystack_plan_code = '${code}' where code = '${s.code}';`,
    );
  }
  console.log("\nRun this in the Supabase SQL Editor:\n");
  console.log(lines.join("\n"));
}

main().catch((e) => {
  console.error(`\nStopped: ${e.message}`);
  console.error(
    "Nothing more was changed. Check the key (and that it matches the mode you meant) and run it again.",
  );
  process.exit(1);
});
