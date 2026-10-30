// Reads a reviewer's spreadsheet and updates the language file.
//   npx tsx scripts/i18n-import.ts ig review/ig-reviewed.csv            (shows what would change, changes nothing)
//   npx tsx scripts/i18n-import.ts ig review/ig-reviewed.csv --write    (applies the good changes)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { en } from "../src/i18n/locales/en";

const [lang, csvPath] = process.argv.slice(2);
const write = process.argv.includes("--write");
if (
  !lang ||
  !["ig", "ha", "yo"].includes(lang) ||
  !csvPath ||
  !existsSync(csvPath)
) {
  console.log(
    "\nUse:  npx tsx scripts/i18n-import.ts ig review/ig-reviewed.csv [--write]\n(the language, then the spreadsheet the reviewer sent back, saved as CSV)\n",
  );
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const english = en as Record<string, string>;
const target = join(ROOT, "src", "i18n", "locales", `${lang}.ts`);
let source = readFileSync(target, "utf8");
// what the app really says now (not what the spreadsheet remembers), so a line that was deleted from the file is noticed
const { dict: now } = (await import(pathToFileURL(target).href)) as {
  dict: Record<string, string>;
};

// a small CSV reader: quotes, commas or semicolons, line breaks inside a cell, and the Excel start mark
function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, "");
  const firstLine = t.split(/\r?\n/, 1)[0];
  const sep = firstLine.includes(",")
    ? ","
    : firstLine.includes(";")
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (quoted) {
      if (c === '"' && t[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const names = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const table = parseCsv(readFileSync(csvPath, "utf8"));
const head = table[0].map((h) => h.trim().toLowerCase());
const col = (name: string) => head.indexOf(name);
const [iKey, iNew, iStatus, iComment] = [
  "key",
  "your_version",
  "status",
  "comment",
].map(col);
if (iKey < 0 || iNew < 0) {
  console.log(
    '\nThe spreadsheet needs the columns "key" and "your_version". Did a column get renamed or removed?\n',
  );
  process.exit(1);
}

const changes: { key: string; from: string; to: string }[] = [];
const problems: string[] = [];
const questions: { key: string; cur: string; comment: string }[] = [];
let confirmed = 0;

for (const r of table.slice(1)) {
  const key = (r[iKey] ?? "").trim();
  if (!key) continue;
  if (!(key in english)) {
    problems.push(
      `${key}: this line does not exist in the app (was the key edited?). Skipped.`,
    );
    continue;
  }
  const status = (r[iStatus] ?? "").trim().toLowerCase();
  const cur = now[key] ?? "";
  const mine = (r[iNew] ?? "").normalize("NFC").trim();
  const comment = (r[iComment] ?? "").trim();

  if (status === "unsure") questions.push({ key, cur, comment });
  if (!mine) {
    if (status === "change")
      problems.push(
        `${key}: status says "change" but "your_version" is empty. Skipped.`,
      );
    else if (status === "ok") confirmed++;
    continue;
  }
  if (names(mine) !== names(english[key])) {
    problems.push(
      `${key}: must keep these {blanks}: [${names(english[key])}] but has [${names(mine)}]. Skipped.`,
    );
    continue;
  }
  if (mine === cur.normalize("NFC").trim()) continue; // the reviewer typed what is already there
  changes.push({ key, from: cur, to: mine });
}

for (const c of changes) {
  const line = `  ${JSON.stringify(c.key)}: ${JSON.stringify(c.to)},`;
  const re = new RegExp(
    `^\\s*${escapeRe(JSON.stringify(c.key))}:\\s*".*",?\\s*$`,
    "m",
  );
  if (re.test(source)) source = source.replace(re, () => line);
  else source = source.replace(/\n};\s*$/, () => `\n${line}\n};\n`); // a line that was missing is added at the end
}

console.log(
  `\nReviewer spreadsheet: ${table.length - 1} rows read for ${lang}.`,
);
console.log(`  confirmed as OK, no change: ${confirmed}`);
console.log(`  changes ready:               ${changes.length}`);
console.log(`  questions from the reviewer: ${questions.length}`);
console.log(`  problems (skipped):          ${problems.length}`);
for (const c of changes.slice(0, 30))
  console.log(`\n  ${c.key}\n    was: ${c.from}\n    now: ${c.to}`);
if (changes.length > 30) console.log(`\n  ...and ${changes.length - 30} more`);
for (const p of problems) console.log(`\n  PROBLEM  ${p}`);

if (questions.length > 0) {
  const dir = join(ROOT, "review");
  mkdirSync(dir, { recursive: true });
  const md =
    [
      `# Questions from the ${lang} reviewer`,
      "",
      ...questions.map(
        (x) =>
          `- **${x.key}**: ${x.cur}\n  - Comment: ${x.comment || "(none)"}`,
      ),
    ].join("\n") + "\n";
  writeFileSync(join(dir, `${lang}-questions.md`), md, "utf8");
  console.log(
    `\nWrote review/${lang}-questions.md (the lines marked "unsure").`,
  );
}

if (write && changes.length > 0) {
  writeFileSync(target, source, "utf8");
  console.log(
    `\nUpdated ${target}.\nNow run:  npm run i18n:check   and   npm run i18n:test\n`,
  );
} else if (changes.length > 0) {
  console.log(
    "\nNothing was changed. Run the same command again with --write to apply these.\n",
  );
} else {
  console.log("\nNo changes to apply.\n");
}
