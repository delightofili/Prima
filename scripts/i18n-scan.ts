// Lists the English words still written directly in screens:  npx tsx scripts/i18n-scan.ts
//   --all     also list the staff tools that stay in English on purpose
//   --strict  stop with an error if any screen still has English (for a future automatic check)
// It reads the code; it changes nothing.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// TypeScript 7 (the new fast version) does not include the code-reading tools this script uses. Versions 5 and 6 do.
if (typeof ts.createSourceFile !== "function") {
  console.log(
    "\nThis script needs TypeScript 5 or 6, because it reads your screens with TypeScript's own code reader.",
  );
  console.log(
    "Your project has a TypeScript without that reader. Check the version with:  npx tsc --version\n",
  );
  process.exit(2);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const showAll = process.argv.includes("--all");
const strict = process.argv.includes("--strict");

// Tools for staff and developers. They stay in English on purpose.
const STAFF = new Set([
  "SyncDoctorPage",
  "TranslationsPage",
  "PhoneCheckPage",
  "TimingCard",
  "LettersTest",
  "IgboFontTest",
]);
// Kept in English for now, on purpose:
//  - legal wording (privacy notice, SMS consent) waits for the privacy review on Day 27, so no unchecked legal text reaches a patient
//  - tools for facility admins and officers (audit log, data requests, LGA report, DHIS2, FHIR) use English standards and reports
const HOLD = new Set([
  "PrivacyPage",
  "PrivacyCard",
  "SmsConsent",
  "RequestsView",
  "AuditView",
  "AdminPage",
  "LgaReportView",
  "Dhis2Card",
  "Dhis2MappingDialog",
  "FhirCard",
  "ExchangeView",
]);
// Attributes whose text a person reads or hears
const TEXT_ATTRS = new Set([
  "placeholder",
  "aria-label",
  "title",
  "alt",
  "label",
  "confirmLabel",
  "message",
  "subtitle",
  "text",
  "summary",
]);
const SKIP_PARENTS = new Set(["code", "pre", "style", "script"]);
// Words that are meant to stay as they are (the language card heading is always in two languages)
const KEEP = new Set([
  "Language · Asụsụ",
  "Review translations (admins)",
  "Prima",
]);

function* walk(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (f === "i18n" || f === "node_modules") continue;
      yield* walk(p);
    } else if (/\.tsx$/.test(f)) yield p;
  }
}

const hasWords = (s: string) =>
  !KEEP.has(s.trim()) && /\p{L}{2,}/u.test(s.replace(/&\w+;/g, " "));
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

// {cond ? "Saving…" : "Register"} and {x && "text"}: a string that is drawn straight on the screen
function inVisibleSlot(node: ts.Node): boolean {
  let child: ts.Node = node;
  for (let p = node.parent; p; child = p, p = p.parent) {
    if (ts.isParenthesizedExpression(p)) continue;
    if (ts.isConditionalExpression(p)) {
      if (p.condition === child) return false;
      continue;
    }
    if (ts.isBinaryExpression(p)) {
      const op = p.operatorToken.kind;
      if (
        op === ts.SyntaxKind.AmpersandAmpersandToken ||
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.QuestionQuestionToken
      )
        continue;
      return false;
    }
    if (ts.isJsxExpression(p)) return !ts.isJsxAttribute(p.parent);
    return false;
  }
  return false;
}

function scan(file: string): string[] {
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isJsxText(n)) {
      const parent = n.parent;
      const tag = ts.isJsxElement(parent)
        ? parent.openingElement.tagName.getText()
        : "";
      const text = clean(n.text);
      if (!SKIP_PARENTS.has(tag) && hasWords(text)) found.push(text);
    } else if (
      ts.isJsxAttribute(n) &&
      n.initializer &&
      ts.isStringLiteral(n.initializer) &&
      TEXT_ATTRS.has(n.name.getText())
    ) {
      if (hasWords(n.initializer.text)) found.push(clean(n.initializer.text));
    } else if (
      (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) &&
      inVisibleSlot(n)
    ) {
      if (hasWords(n.text)) found.push(clean(n.text));
    } else if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "toast" &&
      n.arguments[0]
    ) {
      const a = n.arguments[0];
      if (
        (ts.isStringLiteral(a) ||
          ts.isNoSubstitutionTemplateLiteral(a) ||
          ts.isTemplateExpression(a)) &&
        hasWords(a.getText())
      )
        found.push(clean(a.getText().replace(/^[`"']|[`"']$/g, "")));
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return found;
}

const need: { file: string; list: string[] }[] = [];
const staff: { file: string; list: string[] }[] = [];
const hold: { file: string; list: string[] }[] = [];
for (const file of walk(SRC)) {
  const list = scan(file);
  if (list.length === 0) continue;
  const name = file.replace(/^.*[\\/]/, "").replace(/\.tsx$/, "");
  (STAFF.has(name) ? staff : HOLD.has(name) ? hold : need).push({
    file: relative(ROOT, file).replace(/\\/g, "/"),
    list,
  });
}
need.sort((a, b) => b.list.length - a.list.length);

const show = (rows: typeof need) => {
  for (const r of rows) {
    const sample = r.list
      .slice(0, 3)
      .map((s) => `"${s.length > 38 ? s.slice(0, 36) + "…" : s}"`)
      .join(", ");
    console.log(
      `${String(r.list.length).padStart(4)}  ${r.file}\n      e.g. ${sample}`,
    );
  }
};

console.log("\nEnglish still written inside screens\n");
if (need.length === 0)
  console.log("None. Every screen reads its words from the dictionary.");
else show(need);
const total = need.reduce((n, r) => n + r.list.length, 0);
console.log(
  `\nStill to convert: ${total} pieces of text in ${need.length} files.`,
);
const count = (rows: typeof need) =>
  rows.reduce((n, r) => n + r.list.length, 0);
if (staff.length > 0) {
  if (showAll) {
    console.log("\nStaff tools (kept in English on purpose):");
    show(staff);
  } else
    console.log(
      `Staff tools kept in English on purpose: ${count(staff)} pieces of text in ${staff.length} files.`,
    );
}
if (hold.length > 0) {
  if (showAll) {
    console.log("\nKept in English for now (legal wording and officer tools):");
    show(hold);
  } else
    console.log(
      `Kept in English for now (legal wording, officer tools): ${count(hold)} pieces of text in ${hold.length} files.`,
    );
}
if (!showAll && (staff.length > 0 || hold.length > 0))
  console.log("Add --all to list them.");
console.log("");
process.exit(strict && total > 0 ? 1 : 0);
