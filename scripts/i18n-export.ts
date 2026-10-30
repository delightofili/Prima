// Makes a spreadsheet for a native-speaker reviewer:  npx tsx scripts/i18n-export.ts ig     (or ha, yo)
// Output: review/<language>-review.csv  (opens in Excel or Google Sheets; letters like ị ọ ɓ ɗ ẹ ṣ are kept)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { en } from "../src/i18n/locales/en";

const lang = process.argv[2];
if (!lang || !["ig", "ha", "yo"].includes(lang)) {
  console.log("\nUse:  npx tsx scripts/i18n-export.ts ig     (or ha, or yo)\n");
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const english = en as Record<string, string>;
const { dict } = (await import(
  pathToFileURL(join(ROOT, "src", "i18n", "locales", `${lang}.ts`)).href
)) as { dict: Record<string, string> };
const categories = new Set(
  new Intl.PluralRules(lang).resolvedOptions().pluralCategories,
);

// In plain words: where on the phone the reviewer will see this line
const WHERE: Record<string, string> = {
  lang: "Language card",
  nav: "Bottom tabs and menu",
  common: "Buttons used everywhere",
  age: "Ages (years, months)",
  register: "Registering a patient",
  err: "Message under a box that is not filled in right",
  complaint: "Hint under the reason-for-visit box",
  saved: "After a patient is registered",
  record: "Finish-this-record card",
  sync: "Sync badge and sync panel",
  syncErr: "Sync problem message",
  banner: "Banner at the top of the page",
  power: "Low Battery Mode",
  update: "New version message",
  account: "Account page",
  facility: "Edit facility window",
  team: "Team list",
  invite: "Invite code window",
  patient: "Patient page",
  visit: "Visit pages",
  form: "Full registration form",
  rel: "Relationships (mother, father…)",
  guardian: "Guardian screens",
  family: "Family section on the patient page",
  vaccine: "Vaccines",
  diagnosis: "Diagnosis box",
  badge: "Small labels",
};

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const rows: string[][] = [
  [
    "key",
    "where_it_appears",
    "english",
    "current_translation",
    "your_version",
    "status",
    "comment",
  ],
];
for (const key of Object.keys(english)) {
  const m = /_(zero|one|two|few|many|other)$/.exec(key);
  if (m && !categories.has(m[1] as Intl.LDMLPluralRule)) continue; // a language with no singular form needs no _one lines
  rows.push([
    key,
    WHERE[key.split(".")[0]] ?? "",
    english[key],
    dict[key] ?? "",
    "",
    "",
    "",
  ]);
}

const dir = join(ROOT, "review");
mkdirSync(dir, { recursive: true });
const file = join(dir, `${lang}-review.csv`);
// the leading mark tells Excel the file is UTF-8, so the special letters are not scrambled
writeFileSync(
  file,
  "\uFEFF" + rows.map((r) => r.map(q).join(",")).join("\r\n") + "\r\n",
  "utf8",
);
console.log(`\nWrote ${file}\n${rows.length - 1} lines for the reviewer.`);
console.log(
  "Send this file with docs/TRANSLATION_REVIEW.md. When it comes back, run:",
);
console.log(
  `  npx tsx scripts/i18n-import.ts ${lang} review/${lang}-reviewed.csv\n`,
);
