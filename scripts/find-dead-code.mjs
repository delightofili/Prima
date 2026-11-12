// Finds code nobody uses:   node scripts/find-dead-code.mjs
//   1. FILES in src that nothing reachable from src/main.tsx imports
//   2. EXPORTS that no other file imports
// Files in scripts, tests, test and e2e count as users too, so a name that only a test uses is NOT reported as dead.
// It only reports. It never changes or deletes a file: you decide, then run the tests.
// Uses the TypeScript that is already in the project, so there is nothing new to install.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const SRC = path.join(ROOT, "src");
if (!fs.existsSync(SRC)) {
  console.log(`No src folder in ${ROOT}, so nothing can be judged. Run this from the project folder (the one that holds package.json).`);
  process.exit(2);
}
const ENTRY = ["main.tsx", "main.ts"].map((f) => path.join(SRC, f)).filter((f) => fs.existsSync(f));
const CODE = /\.(ts|tsx|js|jsx|mjs|mts)$/;
const IGNORE = /(\.d\.ts|\.test\.(ts|tsx|js|jsx|mjs)|\.spec\.(ts|tsx))$/;

const listCode = (dir, skip) => {
  const out = [];
  (function walk(d) {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (fs.statSync(p).isDirectory()) { if (name !== "node_modules") walk(p); } else if (CODE.test(name) && !(skip && skip.test(name))) out.push(p);
    }
  })(dir);
  return out;
};
const files = listCode(SRC, IGNORE);
// code outside src that uses src: test scripts, checks, end to end tests
const extraFiles = ["scripts", "tests", "test", "e2e"].map((d) => path.join(ROOT, d)).filter((d) => fs.existsSync(d)).flatMap((d) => listCode(d));

const resolveFrom = (from, spec) => {
  if (!spec.startsWith(".")) return null; // a package, not one of our files
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"].map((e) => base + e), ...[".ts", ".tsx", ".js"].map((e) => path.join(base, "index" + e))])
    if (fs.existsSync(c) && fs.statSync(c).isFile() && CODE.test(c)) return c;
  return null;
};

// what each file exports, and what it takes from other files
const info = new Map();
for (const f of [...files, ...extraFiles]) {
  const sf = ts.createSourceFile(f, fs.readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const exports = new Set(), imports = []; // imports: { file, names:Set }
  const isExported = (n) => ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  const isDefault = (n) => ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
  const add = (from, spec, names) => { const r = resolveFrom(from, spec); if (r) imports.push({ file: r, names }); };
  const visit = (n) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const c = n.importClause, names = new Set();
      if (!c) names.add("*side-effect*");
      else {
        if (c.name) names.add("default");
        if (c.namedBindings) { if (ts.isNamespaceImport(c.namedBindings)) names.add("*"); else c.namedBindings.elements.forEach((e) => names.add((e.propertyName ?? e.name).text)); }
      }
      add(f, n.moduleSpecifier.text, names);
    } else if (ts.isExportDeclaration(n)) {
      if (n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
        if (!n.exportClause) add(f, n.moduleSpecifier.text, new Set(["*"]));
        else if (ts.isNamedExports(n.exportClause)) { add(f, n.moduleSpecifier.text, new Set(n.exportClause.elements.map((e) => (e.propertyName ?? e.name).text))); n.exportClause.elements.forEach((e) => exports.add(e.name.text)); }
        else add(f, n.moduleSpecifier.text, new Set(["*"]));
      } else if (n.exportClause && ts.isNamedExports(n.exportClause)) n.exportClause.elements.forEach((e) => exports.add(e.name.text));
    } else if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) {
      add(f, n.arguments[0].text, new Set(["*"])); // import("./x"): we cannot tell which names are used, so all count as used
    } else if (ts.isExportAssignment(n)) exports.add("default");
    else if (isExported(n)) {
      if (isDefault(n)) exports.add("default");
      else if (ts.isVariableStatement(n)) n.declarationList.declarations.forEach((d) => ts.isIdentifier(d.name) && exports.add(d.name.text));
      else if ((ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isEnumDeclaration(n)) && n.name) exports.add(n.name.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  info.set(f, { exports, imports });
}

// every file reachable from some starting files, following imports through src
const reach = (starts) => {
  const seen = new Set(), queue = [...starts];
  while (queue.length) { const f = queue.pop(); if (seen.has(f) || !info.has(f)) continue; seen.add(f); for (const i of info.get(f).imports) queue.push(i.file); }
  return seen;
};
const reached = reach(ENTRY);
const viaExtra = reach(extraFiles.flatMap((f) => info.get(f).imports.map((i) => i.file)));
const deadFiles = files.filter((f) => !reached.has(f) && !viaExtra.has(f) && !ENTRY.includes(f));
const scriptOnly = files.filter((f) => !reached.has(f) && viaExtra.has(f));

// what is taken from each file by the app, and by scripts and tests
const taken = new Map();
for (const f of [...reached, ...viaExtra, ...extraFiles]) for (const i of info.get(f).imports) { if (!taken.has(i.file)) taken.set(i.file, new Set()); i.names.forEach((n) => taken.get(i.file).add(n)); }
const deadExports = [];
for (const f of reached) {
  if (ENTRY.includes(f)) continue;
  const t = taken.get(f) ?? new Set();
  if (t.has("*")) continue;
  const unused = [...info.get(f).exports].filter((e) => !t.has(e));
  if (unused.length) deadExports.push([f, unused]);
}

const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");
console.log(`\nDead code check: ${files.length} files in src, ${reached.size} reached from ${ENTRY.map(rel).join(", ") || "(no entry found)"}; ${extraFiles.length} script and test files count as users\n`);
if (!ENTRY.length) { console.log("No src/main.tsx found, so nothing can be judged."); process.exit(2); }
console.log(`Files nothing uses (${deadFiles.length}):`);
for (const f of deadFiles.sort()) console.log(`  ${rel(f)}`);
if (!deadFiles.length) console.log("  none");
if (scriptOnly.length) { console.log(`\nFiles only a script or a test uses (${scriptOnly.length}): keep them, or move them out of src`); for (const f of scriptOnly.sort()) console.log(`  ${rel(f)}`); }
console.log(`\nExports that neither the app nor a script or test imports (${deadExports.reduce((n, [, e]) => n + e.length, 0)} in ${deadExports.length} files):`);
for (const [f, e] of deadExports.sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${rel(f)}: ${e.sort().join(", ")}`);
if (!deadExports.length) console.log("  none");
console.log("\nThis only reports. Delete one thing at a time, then run tsc, lint and the tests. A type or a constant that is only exported is harmless: it costs nothing at runtime.\n");
process.exit(0);
