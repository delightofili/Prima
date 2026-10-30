// Tests for the translation engine and the files:  npx tsx scripts/i18n-tests.ts
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import {
  formatDate,
  formatMoney,
  formatNumber,
  interpolate,
  localeFor,
  makeTranslator,
  pickPlural,
} from "../src/i18n/core";
import { en } from "../src/i18n/locales/en";
import { describeSync } from "../src/lib/syncState";
import { validateQuick, emptyQuick } from "../src/lib/quickRegister";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};
const E = en as Record<string, string>;
const load = async (code: string) =>
  (
    (await import(
      pathToFileURL(
        join(
          dirname(fileURLToPath(import.meta.url)),
          "..",
          "src",
          "i18n",
          "locales",
          `${code}.ts`,
        ),
      ).href
    )) as { dict: Record<string, string> }
  ).dict;
const L = { ig: await load("ig"), ha: await load("ha"), yo: await load("yo") };

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
ok(
  "pickPlural falls back to the _other form",
  pickPlural({ x_other: "many" }, "x", 1, "en") === "many",
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
const igbo = makeTranslator(L.ig, E, "ig", (k) => missingLog.push(k));
const hausa = makeTranslator(L.ha, E, "ha");
const yoruba = makeTranslator(L.yo, E, "yo");
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
  "Hausa has two forms: 1 year, 34 years",
  hausa.tp("age.years", 1) === "shekara 1" &&
    hausa.tp("age.years", 34) === "shekaru 34",
);
ok(
  "Hausa: 1 month, 5 months",
  hausa.tp("age.months", 1) === "wata 1" &&
    hausa.tp("age.months", 5) === "watanni 5",
);
ok(
  "Hausa: one record needs attention, three records need attention",
  hausa.tp("sync.attention", 1) === "1 yana buƙatar kulawa" &&
    hausa.tp("sync.attention", 3) === "3 suna buƙatar kulawa",
);
ok(
  "Yoruba has one plural form, so 1 and 34 use the same line",
  yoruba.tp("age.years", 1) === "ọdún 1" &&
    yoruba.tp("age.years", 34) === "ọdún 34",
);
ok(
  "Yoruba uses its own words",
  yoruba.t("nav.patients") === "Àwọn aláìsàn" &&
    yoruba.t("common.cancel") === "Fagilé",
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

/* ---- formats ---- */
const day = new Date(2026, 9, 29);
ok(
  "numbers, dates and naira work in every language",
  ["en", "ig", "ha", "yo"].every(
    (l) =>
      formatNumber(1234567, l).length > 0 &&
      formatDate(day, l, "long").length > 0 &&
      formatMoney(2500, l).includes("2,500"),
  ),
);
ok(
  "naira has the ₦ sign and no kobo, in every language",
  ["en", "ig", "ha", "yo"].every((l) =>
    /^₦2,500$/.test(formatMoney(2500, l).replace(/\s/g, "")),
  ),
  formatMoney(2500, "ha"),
);
ok(
  "month names come from the phone's own calendar",
  /Ọktoba/.test(formatDate(day, "ig", "long")) &&
    /Oktoba/.test(formatDate(day, "ha", "long")) &&
    /Ọ̀wàrà|Owara/i.test(formatDate(day, "yo", "long")),
  `${formatDate(day, "ig", "long")} | ${formatDate(day, "ha", "long")} | ${formatDate(day, "yo", "long")}`,
);
ok(
  "an unknown language falls back to Nigerian English",
  localeFor("zz") === "en-NG",
);

/* ---- the files, for each language ---- */
const names = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");
for (const [code, dict] of Object.entries(L)) {
  const cats = new Set(
    new Intl.PluralRules(code).resolvedOptions().pluralCategories,
  );
  const needed = Object.keys(E).filter((k) => {
    const m = /_(zero|one|two|few|many|other)$/.exec(k);
    return !m || cats.has(m[1] as Intl.LDMLPluralRule);
  });
  ok(
    `${code}: every line the language needs is there`,
    needed.every((k) => k in dict),
    needed.filter((k) => !(k in dict)).join(),
  );
  ok(
    `${code}: no line exists that English does not have (no typos in keys)`,
    Object.keys(dict).every((k) => k in E),
  );
  ok(
    `${code}: every line keeps exactly the same {blanks} as English`,
    Object.keys(dict).every((k) => names(dict[k]) === names(E[k])),
    Object.keys(dict)
      .filter((k) => names(dict[k]) !== names(E[k]))
      .join(),
  );
  ok(
    `${code}: every line is in standard letter form`,
    Object.values(dict).every((v) => v === v.normalize("NFC")),
  );
  ok(
    `${code}: no empty line and no stray spaces`,
    Object.values(dict).every((v) => v.trim() === v && v.length > 0),
  );
  if (!cats.has("one"))
    ok(
      `${code}: no unused _one lines, because it has no singular form`,
      Object.keys(dict).every((k) => !k.endsWith("_one")),
    );
}
ok(
  "every English plural has both forms",
  Object.keys(E)
    .filter((k) => k.endsWith("_one"))
    .every((k) => k.replace(/_one$/, "_other") in E),
);
ok(
  "the Igbo letters are really there",
  ["ị", "ọ", "ụ"].every((c) => Object.values(L.ig).some((v) => v.includes(c))),
);
ok(
  "the Hausa hooked letters are really there",
  ["ɓ", "ɗ", "ƙ"].every((c) => Object.values(L.ha).some((v) => v.includes(c))),
);
ok(
  "the Yoruba dot-below and tone marks are really there",
  ["ẹ", "ọ", "ṣ", "\u0300", "\u0301"].every((c) =>
    Object.values(L.yo).some((v) => v.includes(c)),
  ),
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
  "the sync badge in Hausa",
  say({}, hausa).label === "An daidaita" &&
    say({ online: false, waiting: 3 }, hausa).label ===
      "Babu intanet · an ajiye 3",
);
ok(
  "the sync badge in Yoruba",
  say({}, yoruba).label === "A ti gbé e sókè" &&
    say({ failed: 2 }, yoruba).label === "2 nílò àbójútó",
);
ok(
  "the plan-limit message reads right for 1 and for 3",
  say({ failed: 1, parked: 1 }, eng).detail.startsWith("1 patient is saved") &&
    say({ failed: 3, parked: 3 }, eng).detail.startsWith(
      "3 patients are saved",
    ),
);
ok(
  "Hausa plan-limit message: one patient, three patients",
  say({ failed: 1, parked: 1 }, hausa).detail.startsWith(
    "An ajiye mara lafiya 1",
  ) &&
    say({ failed: 3, parked: 3 }, hausa).detail.startsWith(
      "An ajiye marasa lafiya 3",
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
  "a form error reads in every language",
  igbo.t(errs.fullName!) === "Tinye aha onye ọrịa" &&
    eng.t(errs.fullName!) === "Enter the patient's name" &&
    hausa.t(errs.fullName!) === "Shigar da sunan mara lafiya" &&
    yoruba.t(errs.fullName!) === "Tẹ orúkọ aláìsàn",
);

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
