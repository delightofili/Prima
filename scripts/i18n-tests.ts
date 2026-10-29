// Tests for the translation engine and the files:  npx tsx scripts/i18n-tests.ts
import {
  formatDate,
  formatNumber,
  interpolate,
  localeFor,
  makeTranslator,
  pickPlural,
} from "../src/i18n/core";
import { en } from "../src/i18n/locales/en";
import { dict as ig } from "../src/i18n/locales/ig";
import { describeSync } from "../src/lib/syncState";
import { validateQuick, emptyQuick } from "../src/lib/quickRegister";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};
const E = en as Record<string, string>;
const G = ig as Record<string, string>;

/* ---- the engine ---- */
ok(
  "a {blank} is filled in",
  interpolate("Hello {name}, {n} left", { name: "Ngozi", n: 3 }) ===
    "Hello Ngozi, 3 left",
);
ok(
  "a {blank} with no value stays visible, so a mistake can be seen",
  interpolate("Hello {name}", {}) === "Hello {name}" &&
    interpolate("Hello {name}") === "Hello {name}",
);
ok(
  "text with no blanks is untouched",
  interpolate("Sync now", { x: 1 }) === "Sync now",
);

const eng = makeTranslator({}, E, "en");
ok(
  "English: 1 year and 34 years",
  eng.tp("age.years", 1) === "1 year" && eng.tp("age.years", 34) === "34 years",
);
ok(
  "English: 1 month and 0 months",
  eng.tp("age.months", 1) === "1 month" &&
    eng.tp("age.months", 0) === "0 months",
);

const missingLog: string[] = [];
const igbo = makeTranslator(G, E, "ig", (k) => missingLog.push(k));
ok(
  "Igbo uses its own words",
  igbo.t("common.cancel") === "Kagbuo" && igbo.t("nav.patients") === "Ndị ọrịa",
);
ok(
  "Igbo has one plural form, so 1 and 34 use the same line",
  igbo.tp("age.years", 1) === "afọ 1" && igbo.tp("age.years", 34) === "afọ 34",
);
ok(
  "Igbo plural, with the count inside a longer sentence",
  igbo.tp("sync.attention", 3) === "3 chọrọ nlekọta",
);
ok(
  "a line with several {blanks}",
  igbo
    .t("sync.panelCounts", { waiting: 2, failed: 1 })
    .startsWith("2 na-eche ibulite, 1 chọrọ nlekọta"),
);
const partial = makeTranslator({ "common.cancel": "Kagbuo" }, E, "ig", (k) =>
  missingLog.push(k),
);
ok(
  "a line missing from the language shows English, never a blank or a raw key",
  partial.t("common.save") === "Save" && missingLog.includes("common.save"),
);
ok(
  "a plural missing from the language shows English with the English rule",
  partial.tp("age.years", 1) === "1 year" &&
    partial.tp("age.years", 2) === "2 years",
);
ok(
  "a key that exists nowhere shows the key, so it is noticed",
  partial.t("no.such.key") === "no.such.key",
);
ok(
  "pickPlural falls back to the _other form",
  pickPlural({ x_other: "many" }, "x", 1, "en") === "many",
);

/* ---- formats ---- */
ok(
  "numbers and dates work in every language the app will offer",
  ["en", "ig", "ha", "yo"].every(
    (l) =>
      formatNumber(1234567, l).length > 0 &&
      formatDate(new Date(2026, 9, 28), l, "long").length > 0,
  ),
);
ok(
  "Igbo month names come from the phone's own calendar",
  /Ọktoba/.test(formatDate(new Date(2026, 9, 28), "ig", "long")) ||
    localeFor("ig") === "en-NG",
  formatDate(new Date(2026, 9, 28), "ig", "long"),
);
ok(
  "an unknown language falls back to Nigerian English",
  localeFor("zz") === "en-NG",
);

/* ---- the files ---- */
const names = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");
ok(
  "every Igbo line exists in English (no typos in keys)",
  Object.keys(G).every((k) => k in E),
);
ok(
  "every Igbo line keeps exactly the same {blanks} as English",
  Object.keys(G).every((k) => names(G[k]) === names(E[k])),
  Object.keys(G)
    .filter((k) => names(G[k]) !== names(E[k]))
    .join(),
);
ok(
  "every Igbo line is in standard letter form (ị ọ ụ ṅ are single letters)",
  Object.values(G).every((v) => v === v.normalize("NFC")),
);
ok(
  "Igbo has no unused _one lines, because it has no singular form",
  Object.keys(G).every((k) => !k.endsWith("_one")),
);
ok(
  "every English plural has both forms",
  Object.keys(E)
    .filter((k) => k.endsWith("_one"))
    .every((k) => k.replace(/_one$/, "_other") in E),
);
ok(
  "the Igbo letters are really there",
  ["ị", "ọ", "ụ"].every((c) => Object.values(G).some((v) => v.includes(c))),
);

/* ---- logic that returns messages, not sentences ---- */
const base = {
  online: true,
  cloudOk: true,
  powerActive: false,
  waiting: 0,
  failed: 0,
  parked: 0,
  schemaProblem: null,
  working: false,
  failures: 0,
  nextRetryAt: null,
  now: 1000,
};
const say = (over: object, t: ReturnType<typeof makeTranslator>) => {
  const s = describeSync({ ...base, ...over });
  const m = (x: typeof s.label) =>
    "key" in x ? t.t(x.key, x.params) : t.tp(x.plural, x.count, x.params);
  return { id: s.id, label: m(s.label), detail: m(s.detail) };
};
ok(
  "the sync badge in English says what it said before",
  say({ failed: 1 }, eng).label === "1 needs attention" &&
    say({ failed: 3 }, eng).label === "3 need attention" &&
    say({ online: false, waiting: 3 }, eng).label === "Offline · 3 saved" &&
    say({ waiting: 1, nextRetryAt: 41_000 }, eng).label ===
      "Retrying in 40 s · 1 waiting",
);
ok(
  "the sync badge in Igbo",
  say({ failed: 3 }, igbo).label === "3 chọrọ nlekọta" &&
    say({ online: false, waiting: 3 }, igbo).label ===
      "Enweghị ịntanetị · 3 echekwara" &&
    say({}, igbo).label === "E bulitela",
);
ok(
  "the plan-limit message reads right for 1 and for 3",
  say({ failed: 1, parked: 1 }, eng).detail.startsWith("1 patient is saved") &&
    say({ failed: 3, parked: 3 }, eng).detail.startsWith(
      "3 patients are saved",
    ),
);

/* ---- form errors are keys, so they follow the language ---- */
const errs = validateQuick(emptyQuick(), new Date(2026, 9, 24));
ok(
  "form errors are dictionary keys",
  Object.values(errs).every((k) => typeof k === "string" && k in E),
  JSON.stringify(errs),
);
ok(
  "a form error reads in Igbo",
  igbo.t(errs.fullName!) === "Tinye aha onye ọrịa" &&
    eng.t(errs.fullName!) === "Enter the patient's name",
);

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
