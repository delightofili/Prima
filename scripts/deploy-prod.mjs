// Deploys PRODUCTION. Run from the project root:   npm run deploy:prod
//
// It refuses to continue unless it can prove the build talks to the production database and to nothing else.
// A wrong key in a build would put real patients into your test project, or test data into production.
//
// It reads two files that are never committed:
//   .env.local        your TEST project (what you already use)
//   .env.prod.local   your PRODUCTION project (new). Built with:  vite build --mode prod
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";

export const PROJECT = "prima-app"; // the Cloudflare Pages project that serves production
export const ADDRESS = "https://app.primahealth.com.ng";
const PROD_FILE = ".env.prod.local";
const TEST_FILE = ".env.local";
const REQUIRED = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_KEY",
  "VITE_PAYMENTS_MODE",
];

// KEY=value lines. Blank lines and # comments are ignored; quotes around a value are removed.
export function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(
      line,
    );
    if (!m || line.trim().startsWith("#")) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

// The project reference inside https://<ref>.supabase.co
export const refOf = (url) =>
  /^https:\/\/([a-z0-9]{15,30})\.supabase\.co\/?$/.exec(url ?? "")?.[1] ?? null;

// What a legacy key says it is allowed to do ("anon" is safe to publish, "service_role" never is). Null if it is not that kind of key.
export function jwtRole(token) {
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;
  try {
    return (
      JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).role ??
      null
    );
  } catch {
    return null;
  }
}

// What is wrong with the production settings. An empty list means they are fine.
export function envProblems(prod, test) {
  const errors = [];
  const notes = [];
  for (const k of REQUIRED)
    if (!prod[k]) errors.push(`${k} is missing from ${PROD_FILE}.`);
  const prodRef = refOf(prod.VITE_SUPABASE_URL);
  if (prod.VITE_SUPABASE_URL && !prodRef)
    errors.push(
      `VITE_SUPABASE_URL should look like https://abcdefghijklmnopqrst.supabase.co (no slash, no spaces).`,
    );

  const key = prod.VITE_SUPABASE_KEY ?? "";
  if (key.startsWith("sb_secret_") || jwtRole(key) === "service_role")
    errors.push(
      "VITE_SUPABASE_KEY is a SECRET key. Anything starting with VITE_ is copied into the app that everyone downloads. Use the anon (publishable) key.",
    );
  else if (key && !key.startsWith("sb_publishable_") && jwtRole(key) !== "anon")
    errors.push(
      "VITE_SUPABASE_KEY does not look like the anon (publishable) key. Copy it again from Supabase: Project Settings, API.",
    );

  if (
    test.VITE_SUPABASE_URL &&
    refOf(test.VITE_SUPABASE_URL) &&
    prodRef === refOf(test.VITE_SUPABASE_URL)
  )
    errors.push(
      `${PROD_FILE} points at the SAME Supabase project as ${TEST_FILE}. That is the TEST project. Production must be its own project.`,
    );
  if (test.VITE_SUPABASE_KEY && key && key === test.VITE_SUPABASE_KEY)
    errors.push(`${PROD_FILE} uses the same key as ${TEST_FILE}.`);

  // A setting that only the test file has would be copied into the production build too
  const leaked = Object.keys(test).filter(
    (k) => k.startsWith("VITE_") && !(k in prod),
  );
  if (leaked.length)
    errors.push(
      `${TEST_FILE} has settings that ${PROD_FILE} does not, and they would be copied into production: ${leaked.join(", ")}. Add each one to ${PROD_FILE} (an empty value is fine).`,
    );

  for (const k of Object.keys(prod))
    if (/SECRET|SERVICE|PRIVATE|PASSWORD|TOKEN/i.test(k))
      errors.push(
        `${k}: a name like this must not start with VITE_, because VITE_ values are published inside the app.`,
      );

  const mode = prod.VITE_PAYMENTS_MODE;
  if (mode && mode !== "test" && mode !== "live")
    errors.push('VITE_PAYMENTS_MODE must be "test" or "live".');
  if (mode === "live") notes.push("PAYMENTS ARE LIVE: real money will move.");
  if (prod.VITE_PYTHON_API_URL && !/^https:\/\//.test(prod.VITE_PYTHON_API_URL))
    errors.push(
      "VITE_PYTHON_API_URL is set to an address that is not https://. Leave it empty if the Python service is not hosted.",
    );
  return { errors, notes, prodRef };
}

// Test-file values worth searching the whole build for: an address, a key or an id (no spaces, long). An ordinary phrase such as a
// clinic name or an LGA appears in the app's own text for innocent reasons, so phrases are checked another way (bakedSettings, below).
export function testOnlyValues(prod, test) {
  return Object.entries(test)
    .filter(
      ([name, value]) =>
        name.startsWith("VITE_") &&
        name !== "VITE_SUPABASE_URL" &&
        value.length >= 12 &&
        !/\s/.test(value) &&
        prod[name] !== value,
    )
    .map(([name, value]) => ({ name, value }));
}

// The settings that are really baked into the build. Vite writes each VITE_ setting into the app as NAME:"value", so this reads the
// truth about what people will download, and a coincidence in the app's own text can never be mistaken for a leak.
export function bakedSettings(js) {
  const out = {};
  for (const m of js.matchAll(
    /["']?(VITE_[A-Z0-9_]+)["']?\s*:\s*("(?:[^"\\\n]|\\.)*")/g,
  )) {
    try {
      out[m[1]] = JSON.parse(m[2]);
    } catch {
      out[m[1]] = m[2].slice(1, -1);
    }
  }
  return out;
}

const filesIn = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? filesIn(p) : [p];
  });

// What is wrong with the built files. Read AFTER the build, because this is what people will actually download.
export function distProblems(
  dist,
  prodUrl,
  testUrl,
  testOnly = [],
  prod = null,
) {
  const errors = [];
  for (const f of ["index.html", "version.json", "_headers"])
    if (!existsSync(join(dist, f))) errors.push(`dist/${f} is missing.`);
  if (
    existsSync(join(dist, "_headers")) &&
    !/Content-Security-Policy/.test(
      readFileSync(join(dist, "_headers"), "utf8"),
    )
  )
    errors.push("dist/_headers has no Content-Security-Policy.");
  const js = existsSync(dist)
    ? filesIn(dist)
        .filter((f) => /\.(js|html)$/.test(f))
        .map((f) => readFileSync(f, "utf8"))
        .join("\n")
    : "";
  const host = prodUrl.replace(/\/$/, "");
  if (!js.includes(host))
    errors.push(
      `The built app does not contain ${host}. It was not built for production.`,
    );
  if (testUrl && testUrl !== prodUrl && js.includes(testUrl.replace(/\/$/, "")))
    errors.push(
      `The built app contains the TEST project address ${testUrl}. It would send real patients to the test database.`,
    );
  if (/sk_(live|test)_[A-Za-z0-9]{10,}/.test(js))
    errors.push("A Paystack SECRET key (sk_...) is inside the built app.");
  if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(js))
    errors.push(
      "A Supabase SECRET key (sb_secret_...) is inside the built app.",
    );
  for (const t of js.match(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}/g) ?? [])
    if (jwtRole(t) === "service_role")
      errors.push(
        "A Supabase service_role key is inside the built app. Anyone could read every patient.",
      );
  // 1. Every setting baked into the build must have exactly the value in the production file (names only are printed, never values).
  if (prod)
    for (const [name, value] of Object.entries(bakedSettings(js)))
      if (value !== (prod[name] ?? ""))
        errors.push(
          `The built app has ${name} set to something other than the value in ${PROD_FILE}. It would be a test setting inside production.`,
        );
  // 2. An address, key or id that only the TEST file has must not be anywhere in the build. (Libraries such as Supabase's contain text like
  // http://localhost:9999 as their own default: that is not a leak, so the check looks for YOUR settings' values, not for the word localhost.)
  for (const { name, value } of testOnly)
    if (value && js.includes(value))
      errors.push(
        `The built app contains the value of ${name}, a setting that only your TEST file has. It would be copied into production.`,
      );
  return errors;
}

const realRun = (cmd, args) =>
  spawnSync(cmd, args, { stdio: "inherit", shell: true }).status ?? 1;
const realAsk = async (q) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(q)).trim();
  } finally {
    rl.close();
  }
};

export async function main({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  run = realRun,
  ask = realAsk,
  log = console.log,
} = {}) {
  const at = (p) => join(cwd, p);
  if (!existsSync(at("package.json"))) {
    log("Run this from the project root (the folder with package.json).");
    return 1;
  }
  if (!existsSync(at(PROD_FILE))) {
    log(
      `\nThere is no ${PROD_FILE} yet. Create it next to .env.local with the PRODUCTION project's values:\n`,
    );
    log(
      "  VITE_SUPABASE_URL=https://<production-ref>.supabase.co\n  VITE_SUPABASE_KEY=<the production anon (publishable) key>\n  VITE_PAYMENTS_MODE=test\n  VITE_PYTHON_API_URL=\n",
    );
    return 1;
  }
  const prod = parseEnv(readFileSync(at(PROD_FILE), "utf8"));
  const test = existsSync(at(TEST_FILE))
    ? parseEnv(readFileSync(at(TEST_FILE), "utf8"))
    : {};
  const { errors, notes, prodRef } = envProblems(prod, test);
  if (errors.length) {
    log("\nNOT DEPLOYING. Fix these first:\n");
    for (const e of errors) log(`  NO  ${e}`);
    return 1;
  }
  log(
    `\nProduction database : ${prodRef}\nTest database       : ${refOf(test.VITE_SUPABASE_URL) ?? "(none)"}\nPayments            : ${prod.VITE_PAYMENTS_MODE}\nAddress             : ${ADDRESS}\n`,
  );
  for (const n of notes) log(`  !!  ${n}`);

  log("Checking the code (tsc)...");
  if (run("npx", ["tsc", "-b"]) !== 0) {
    log("\nThe code has errors. Fix them first.");
    return 1;
  }
  log("\nBuilding for production (vite build --mode prod)...");
  if (run("npx", ["vite", "build", "--mode", "prod"]) !== 0) {
    log("\nThe build failed.");
    return 1;
  }

  const built = distProblems(
    at("dist"),
    prod.VITE_SUPABASE_URL,
    test.VITE_SUPABASE_URL,
    testOnlyValues(prod, test),
    prod,
  );
  if (built.length) {
    log("\nNOT DEPLOYING. The built files are not safe:\n");
    for (const e of built) log(`  NO  ${e}`);
    return 1;
  }
  log(
    "  OK  the built app points only at the production database, holds no secret key, and has its security headers.\n",
  );

  if (!argv.includes("--yes")) {
    const answer = await ask(
      `This puts the app live at ${ADDRESS}.\nType  DEPLOY PRODUCTION  to continue (anything else cancels): `,
    );
    if (answer !== "DEPLOY PRODUCTION") {
      log("\nCancelled. Nothing was deployed.");
      return 1;
    }
  }
  if (
    run("npx", [
      "wrangler",
      "pages",
      "deploy",
      "dist",
      "--project-name",
      PROJECT,
      "--branch",
      "main",
    ]) !== 0
  ) {
    log("\nThe upload failed.");
    return 1;
  }
  log(
    `\nDeployed. Check it:\n  npm run verify:deploy -- ${ADDRESS}\n  npm run verify:prod\n`,
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(await main());
