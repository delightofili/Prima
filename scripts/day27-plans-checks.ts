// Day 27: the Plans page and plan card read their wording from dictionary keys, while the upgrade window still reads the English list in plan.ts.
// This fails if the two ever stop matching, or if a key is missing from any of the four languages.
// It READS plan.ts as text and never runs it (plan.ts pulls in config.ts, which only works inside Vite).
// Run from the project root:   npx tsx scripts/day27-plans-checks.ts
import fs from "node:fs";
import path from "node:path";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};

const read = (p: string) => fs.readFileSync(path.resolve(p), "utf8");
const strings = (text: string) =>
  [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
// the text of one exported constant, from its name to the line that closes it
const constant = (src: string, name: string, close: string) => {
  const i = src.indexOf(`export const ${name}`);
  if (i < 0) return "";
  const j = src.indexOf(close, i);
  return j < 0 ? "" : src.slice(i, j);
};

const plan = read("src/lib/plan.ts");
const plans = ["free", "basic", "pro"] as const;

const plansBlock = constant(plan, "PLANS", "\n];");
const featuresBlock = constant(plan, "PLAN_FEATURES", "\n};");
const namesBlock = constant(plan, "PLAN_NAME_KEY", "\n};");
ok(
  "plan.ts has PLANS, PLAN_FEATURES and PLAN_NAME_KEY",
  plansBlock !== "" && featuresBlock !== "" && namesBlock !== "",
);

const english = (id: string) =>
  strings(
    new RegExp(`id:\\s*"${id}"[\\s\\S]*?features:\\s*\\[([\\s\\S]*?)\\]`).exec(
      plansBlock,
    )?.[1] ?? "",
  );
const keysOf = (id: string) =>
  strings(
    new RegExp(`${id}:\\s*\\[([\\s\\S]*?)\\]`).exec(featuresBlock)?.[1] ?? "",
  );
const nameKey = (id: string) =>
  new RegExp(`${id}:\\s*"([^"]+)"`).exec(namesBlock)?.[1];

const LANGS = ["en", "ig", "ha", "yo"] as const;
const dictKeys = (lang: string) =>
  new Set(
    [...read(`src/i18n/locales/${lang}.ts`).matchAll(/^\s*"([^"]+)":/gm)].map(
      (m) => m[1],
    ),
  );
const dict = Object.fromEntries(LANGS.map((l) => [l, dictKeys(l)])) as Record<
  (typeof LANGS)[number],
  Set<string>
>;

ok(
  "the English list has the three plans",
  plans.every((p) => english(p).length > 0),
);
for (const p of plans) {
  ok(
    `${p}: the translated list has as many features as the English list (${english(p).length})`,
    keysOf(p).length === english(p).length,
    `${keysOf(p).length} keys for ${english(p).length} features`,
  );
}
const featureKeys = plans.flatMap((p) => keysOf(p));
ok(
  "no feature key is used twice",
  new Set(featureKeys).size === featureKeys.length,
);
const allKeys = [
  ...plans.map((p) => nameKey(p) ?? `(no name key for ${p})`),
  ...featureKeys,
];
for (const lang of LANGS) {
  const missing = allKeys.filter((k) => !dict[lang].has(k));
  ok(
    `[${lang}] every plan name and feature key has a line in the dictionary`,
    missing.length === 0,
    missing.join(", "),
  );
}
// The English dictionary line must say what the English list says, so the two screens never disagree about what a plan includes
const enText = read("src/i18n/locales/en.ts");
const enLine = (key: string) =>
  new RegExp(`"${key.replace(/\./g, "\\.")}":\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(
    enText,
  )?.[1];
for (const p of plans) {
  english(p).forEach((f, i) => {
    ok(
      `${p} feature ${i + 1} says the same in the dictionary as in plan.ts`,
      enLine(keysOf(p)[i]) === f,
      `"${enLine(keysOf(p)[i])}" vs "${f}"`,
    );
  });
}
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
