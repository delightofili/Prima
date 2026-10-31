// Checks every translation file against the English baseline:  npx tsx scripts/i18n-check.ts
// ERROR = a real problem (stops you). warn = worth a look. It changes nothing.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { en } from "../src/i18n/locales/en";

const LANGUAGES = ["ig", "ha", "yo"]; // a language whose file does not exist yet is skipped
const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const english = en as Record<string, string>;
const problems: { level: "ERROR" | "warn"; text: string }[] = [];
const err = (text: string) => problems.push({ level: "ERROR", text });
const warn = (text: string) => problems.push({ level: "warn", text });

const names = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");

// ---- 1. every key the code asks for exists, and every English line is used somewhere
function* walk(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !p.includes(`${join("i18n", "locales")}`))
      yield p;
  }
}
const GROUPS =
  "lang|nav|common|age|register|err|complaint|saved|record|sync|syncErr|banner|power|update|account|facility|team|invite|patient|visit|form|rel|guardian|family|vaccine|diagnosis|badge|home|list|limit|card|scan|upgrade|vitals|stepper|glove|app|auth|authErr|lock|security|session|dash|fu|dev";
const KEY = new RegExp(`"((?:${GROUPS})\\.[\\w.]+)"`, "g");
// Only a real call to the translator counts: t("nav.home") or tp("sync.attention", 3), with one of our word groups.
// Your own data (a dashboard figure with key: "visits", a vaccine with key: "bcg", an audit action "team.invite") is not a translation line.
// TypeScript checks every other place a key can be written, so a wrong key there stops the build anyway.
const CALLS = new RegExp(`\\b(?:t|tp)\\(\\s*"((?:${GROUPS})\\.[\\w.]+)"`, "g");
const used = new Set<string>();
const asked = new Set<string>();
for (const file of walk(SRC)) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(KEY)) used.add(m[1]);
  for (const m of text.matchAll(CALLS)) asked.add(m[1]);
}
const known = (k: string) =>
  k in english ||
  `${k}_other` in english ||
  Object.keys(english).some((e) => e.startsWith(`${k}.`));
for (const k of asked)
  if (!known(k))
    err(`the code asks for "${k}" but it is not in the English dictionary`);
const usedBases = [...used];
for (const k of Object.keys(english)) {
  const base = k.replace(/_(one|other)$/, "");
  if (!usedBases.includes(k) && !usedBases.includes(base))
    warn(`English line never used by any screen: ${k}`);
}

// ---- 2. each language against English
const report: string[] = [];
for (const lang of LANGUAGES) {
  const file = join(SRC, "i18n", "locales", `${lang}.ts`);
  if (!existsSync(file)) continue;
  // On Windows a path like C:\... is not a valid module address, so it is turned into a file:// address first
  const { dict } = (await import(pathToFileURL(file).href)) as {
    dict: Record<string, string>;
  };
  const categories = new Set(
    new Intl.PluralRules(lang).resolvedOptions().pluralCategories,
  );
  const needed = Object.keys(english).filter((k) => {
    const m = /_(zero|one|two|few|many|other)$/.exec(k);
    return !m || categories.has(m[1] as Intl.LDMLPluralRule);
  });

  const missing = needed.filter((k) => !(k in dict));
  const extra = Object.keys(dict).filter((k) => !(k in english));
  const wrongPlural = Object.keys(dict).filter((k) => {
    const m = /_(zero|one|two|few|many|other)$/.exec(k);
    return m && k in english && !categories.has(m[1] as Intl.LDMLPluralRule);
  });
  for (const k of extra)
    err(
      `${lang}: "${k}" is not in the English dictionary (a typo, or a line that was removed)`,
    );
  for (const k of wrongPlural)
    warn(
      `${lang}: "${k}" is not needed, this language has no "${k.split("_").pop()}" form`,
    );

  let same = 0;
  let long = 0;
  for (const [k, v] of Object.entries(dict)) {
    if (!(k in english)) continue;
    if (v !== v.normalize("NFC"))
      err(
        `${lang}: "${k}" has letters in a split form. Retype ị ọ ụ ṅ and save as UTF-8`,
      );
    if (v.trim() === "")
      err(`${lang}: "${k}" is empty. Delete the line to show English instead`);
    if (names(v) !== names(english[k]))
      err(
        `${lang}: "${k}" must keep these {blanks}: [${names(english[k])}] but has [${names(v)}]`,
      );
    if (/\s{2,}|^\s|\s$/.test(v)) warn(`${lang}: "${k}" has extra spaces`);
    if (
      v === english[k] &&
      english[k].length > 4 &&
      !/^[A-Z0-9 ·%{}().,:-]+$/.test(english[k])
    ) {
      same++;
      warn(`${lang}: "${k}" is the same as English`);
    }
    if (english[k].length >= 18 && v.length > english[k].length * 1.8) {
      long++;
      warn(
        `${lang}: "${k}" is ${(v.length / english[k].length).toFixed(1)} times longer than English, check it fits the button or space`,
      );
    }
  }
  const done = needed.length - missing.length;
  report.push(
    `${lang}: ${done} of ${needed.length} lines translated (${Math.round((done / needed.length) * 100)}%), ${missing.length} still English${same ? `, ${same} same as English` : ""}${long ? `, ${long} much longer than English` : ""}`,
  );
  for (const k of missing)
    warn(`${lang}: no translation yet for "${k}" (English is shown)`);
}

const errors = problems.filter((p) => p.level === "ERROR");
console.log("\nTranslation check\n");
for (const p of problems.filter((x) => x.level === "ERROR"))
  console.log(`ERROR  ${p.text}`);
const warnings = problems.filter((p) => p.level === "warn");
for (const p of warnings.slice(0, 40)) console.log(`warn   ${p.text}`);
if (warnings.length > 40)
  console.log(`warn   ...and ${warnings.length - 40} more`);
console.log(
  `\nEnglish lines: ${Object.keys(english).length}. Lines the code uses: ${used.size}.`,
);
for (const r of report) console.log(r);
console.log(
  errors.length
    ? `\n${errors.length} problem(s) to fix.\n`
    : "\nNo problems.\n",
);
process.exit(errors.length ? 1 : 0);
