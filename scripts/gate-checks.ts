// Day 27 gate, the project-files half. Run:   npx tsx scripts/gate-checks.ts            (a report)
//                                              npx tsx scripts/gate-checks.ts --strict   (also fails while any MUST box in docs/gate is unticked: use this before real patient data)
// It only reads. The database half is supabase/gate.sql.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const rootArg = args.indexOf("--root");
const ROOT = path.resolve(rootArg >= 0 ? args[rootArg + 1] : process.cwd());

type Status = "PASS" | "FAIL" | "WARN";
interface Result {
  group: string;
  label: string;
  status: Status;
  detail: string;
}
const results: Result[] = [];
const add = (group: string, label: string, status: Status, detail = "") =>
  results.push({ group, label, status, detail });

/* ---------- reading the project ---------- */

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".venv",
  "coverage",
  ".temp",
  ".branches",
  ".wrangler",
  ".vite",
  "__pycache__",
]);
const TEXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|md|html|css|yml|yaml|sql|toml|txt|env|sh)$|(^|\/)\.env[^/]*$|(^|\/)_headers$/i;

function walk(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // a folder that cannot be read has nothing to check
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out);
    } else if (
      TEXT.test(e.name) ||
      TEXT.test(path.join(dir, e.name).replace(/\\/g, "/"))
    ) {
      const p = path.join(dir, e.name);
      try {
        if (fs.statSync(p).size <= 1_000_000) out.push(p);
      } catch {
        /* unreadable */
      }
    }
  }
  return out;
}
const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");
const read = (p: string) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
};
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

const files = walk(ROOT);
// Test files and notes hold made-up keys on purpose, so they are not searched for secrets
const secretScope = files.filter(
  (f) => !/^(scripts|docs)\//.test(rel(f)) && !/\.test\.|\.spec\./.test(f),
);
const srcFiles = files.filter(
  (f) => /^src\//.test(rel(f)) && /\.(ts|tsx|js|jsx)$/.test(f),
);

function hits(list: string[], pattern: RegExp, skipComments = true): string[] {
  const found: string[] = [];
  for (const f of list) {
    read(f)
      .split("\n")
      .forEach((line, i) => {
        const t = line.trim();
        if (
          skipComments &&
          (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"))
        )
          return;
        if (pattern.test(line)) found.push(`${rel(f)}:${i + 1}`);
      });
  }
  return found;
}
const shown = (list: string[], n = 6) =>
  list.slice(0, n).join(", ") +
  (list.length > n ? ` and ${list.length - n} more` : "");

/* ---------- 1. secrets ---------- */
{
  const G = "Secrets";
  const live = hits(secretScope, /sk_live_[A-Za-z0-9]{10,}/, false);
  add(
    G,
    "No live Paystack key in any file",
    live.length ? "FAIL" : "PASS",
    live.length ? shown(live) : "",
  );
  const test = hits(secretScope, /sk_test_[A-Za-z0-9]{10,}/, false);
  add(
    G,
    "No Paystack test secret key in any file (it is a secret too)",
    test.length ? "FAIL" : "PASS",
    test.length ? shown(test) : "",
  );
  const priv = hits(
    secretScope,
    /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    false,
  );
  add(
    G,
    "No private key file contents",
    priv.length ? "FAIL" : "PASS",
    priv.length ? shown(priv) : "",
  );
  // A Supabase "anon" key is public by design. A "service_role" key can do anything and must never be in a file.
  const jwtRe =
    /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
  const dangerous: string[] = [];
  for (const f of secretScope) {
    for (const m of read(f).matchAll(jwtRe)) {
      try {
        const payload = JSON.parse(
          Buffer.from(m[1], "base64url").toString("utf8"),
        ) as { role?: string };
        if (payload.role === "service_role") dangerous.push(rel(f));
      } catch {
        /* not a real token */
      }
    }
  }
  add(
    G,
    "No Supabase service_role key in any file (an anon key is fine)",
    dangerous.length ? "FAIL" : "PASS",
    dangerous.length ? shown([...new Set(dangerous)]) : "",
  );
  const inApp = hits(srcFiles, /SERVICE_ROLE/i, false);
  add(
    G,
    "The app (src) never mentions the service role",
    inApp.length ? "FAIL" : "PASS",
    inApp.length ? shown(inApp) : "",
  );
  const ignore = read(path.join(ROOT, ".gitignore"))
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const isIgnored = (name: string) => {
    let ignored = false;
    for (const rule of ignore) {
      const neg = rule.startsWith("!");
      const body = (neg ? rule.slice(1) : rule)
        .replace(/^\//, "")
        .replace(/\/$/, "");
      const re = new RegExp(
        "^" +
          body.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") +
          "$",
      );
      if (re.test(name)) ignored = !neg;
    }
    return ignored;
  };
  const notIgnored = [
    ".env",
    ".env.local",
    ".env.production",
    ".dev.vars",
  ].filter((n) => !isIgnored(n));
  add(
    G,
    "Git ignores .env, .env.local, .env.production and .dev.vars",
    notIgnored.length ? "FAIL" : "PASS",
    notIgnored.length ? `not ignored: ${notIgnored.join(", ")}` : "",
  );
}

/* ---------- 2. code ---------- */
{
  const G = "Code";
  const risky = hits(
    srcFiles,
    /dangerouslySetInnerHTML|\beval\s*\(|new Function\s*\(|\.innerHTML\s*=|document\.write\s*\(/,
  );
  add(
    G,
    "No code that writes raw HTML or runs text as code",
    risky.length ? "FAIL" : "PASS",
    risky.length ? shown(risky) : "",
  );
  const logs = hits(srcFiles, /console\.(log|info|debug)\s*\(/);
  add(
    G,
    "No console.log in the app (a log line can leak a patient's details)",
    logs.length ? "WARN" : "PASS",
    logs.length ? shown(logs) : "",
  );
  const pii = hits(
    srcFiles,
    /console\.\w+\(.*\b(fullName|phone|patient|guardian|complaint|diagnosis|cardNumber)\b/i,
  );
  add(
    G,
    "No log line that mentions patient fields",
    pii.length ? "FAIL" : "PASS",
    pii.length ? shown(pii) : "",
  );
  const dbg = hits(srcFiles, /^\s*debugger\s*;?\s*$/);
  add(
    G,
    "No leftover debugger statements",
    dbg.length ? "WARN" : "PASS",
    dbg.length ? shown(dbg) : "",
  );
  const pkgText = read(path.join(ROOT, "package.json"));
  let loose: string[] = [];
  try {
    const pkg = JSON.parse(pkgText) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    loose = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
      .filter(([, v]) => v === "*" || v === "latest" || v === "")
      .map(([k]) => k);
  } catch {
    /* no package.json here */
  }
  add(
    G,
    "No dependency set to 'latest' or '*'",
    loose.length ? "WARN" : "PASS",
    loose.join(", "),
  );
  add(
    G,
    "A lock file is committed (so the same versions are installed every time)",
    exists("package-lock.json") ||
      exists("pnpm-lock.yaml") ||
      exists("yarn.lock")
      ? "PASS"
      : "FAIL",
  );
}

/* ---------- 3. what the browser is told ---------- */
{
  const G = "Browser";
  const html = read(path.join(ROOT, "index.html"));
  add(
    G,
    'index.html declares a language (<html lang="...">), for screen readers and translation',
    /<html[^>]*\blang=["'][a-z]{2}/i.test(html) ? "PASS" : "FAIL",
  );
  add(
    G,
    "index.html has a viewport and does not block zooming",
    /name=["']viewport["']/.test(html) &&
      !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(html)
      ? "PASS"
      : "FAIL",
    "people with low vision must be able to zoom",
  );
  const headersPath = ["public/_headers", "_headers"].find(exists);
  if (!headersPath) {
    add(
      G,
      "Security headers file (public/_headers)",
      "WARN",
      "not found: add Content-Security-Policy, X-Content-Type-Options and Referrer-Policy",
    );
  } else {
    const h = read(path.join(ROOT, headersPath));
    const missing = [
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
    ].filter((k) => !new RegExp(k, "i").test(h));
    add(
      G,
      `Security headers are set (${headersPath})`,
      missing.length ? "WARN" : "PASS",
      missing.length ? `missing: ${missing.join(", ")}` : "",
    );
  }
}

/* ---------- 4. the written gate ---------- */
const docs = ["docs/gate/NDPA.md", "docs/gate/CLINICAL-SAFETY.md"];
let mustOpen = 0;
let mustDone = 0;
const openList: string[] = [];
{
  const G = "Documents";
  add(
    G,
    "supabase/gate.sql is in the project",
    exists("supabase/gate.sql") ? "PASS" : "FAIL",
  );
  for (const d of docs) {
    if (!exists(d)) {
      add(G, `${d} exists`, "FAIL", "missing");
      continue;
    }
    let open = 0;
    let done = 0;
    for (const line of read(path.join(ROOT, d)).split("\n")) {
      const m = /^\s*[-*]\s*\[( |x|X)\]\s*MUST\b:?\s*(.*)$/.exec(line);
      if (!m) continue;
      if (m[1] === " ") {
        open++;
        if (openList.length < 40)
          openList.push(`${path.basename(d)}: ${m[2].slice(0, 90)}`);
      } else done++;
    }
    mustOpen += open;
    mustDone += done;
    add(
      G,
      `${d}: every MUST box is ticked`,
      open === 0 && done > 0 ? "PASS" : strict ? "FAIL" : "WARN",
      `${done} done, ${open} still to do`,
    );
  }
}

/* ---------- the report ---------- */
const order: Status[] = ["FAIL", "WARN", "PASS"];
let group = "";
console.log(
  `Prima gate: project files   (${rel(ROOT) || "."}, ${strict ? "strict" : "report"})\n`,
);
for (const r of results) {
  if (r.group !== group) {
    group = r.group;
    console.log(`\n${group}`);
  }
  console.log(
    `  ${r.status}  ${r.label}${r.detail ? `\n        ${r.detail}` : ""}`,
  );
}
const count = (s: Status) => results.filter((r) => r.status === s).length;
console.log(
  `\n${count("PASS")} passed, ${count("WARN")} to look at, ${count("FAIL")} failed.`,
);
console.log(
  `Written gate: ${mustDone} MUST items done, ${mustOpen} still open.`,
);
if (mustOpen) {
  console.log("Still open (first ones):");
  for (const o of openList.slice(0, 10)) console.log(`  [ ] ${o}`);
}
console.log(
  "\nAlso run: npm run i18n:check, and the database half (supabase/gate.sql in the Supabase SQL Editor).",
);
const blocked = count("FAIL") > 0 || (strict && mustOpen > 0);
console.log(
  blocked
    ? "\nRESULT: NOT READY for real patient data."
    : strict
      ? "\nRESULT: this half of the gate is clear."
      : "\nRESULT: no failures in the files (the written gate is checked with --strict).",
);
void order;
process.exit(blocked ? 1 : 0);
