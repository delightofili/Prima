// Builds the landing page: node build.mjs
// Reads site.config.json, fills the {{tokens}} in the files in src/, writes the finished site to dist/.
// No packages needed. Run it again whenever you change the config.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEXT = new Set([".html", ".xml", ".txt", ".css", ".js", ".json", ""]);

const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A Nigerian number in any usual style becomes the international form WhatsApp wants (digits only).
export function normalizeWhatsapp(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
  if (digits.length === 10 && /^[789]/.test(digits)) return "234" + digits;
  if (digits.length >= 11 && digits.length <= 15 && !digits.startsWith("0")) return digits; // a number from another country
  throw new Error(`"whatsapp" does not look like a phone number: ${input}`);
}

export function readConfig(path) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const domain = String(raw.domain ?? "").trim().replace(/\/+$/, "");
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(domain)) throw new Error(`"domain" must look like https://yourname.com.ng (no path, no slash at the end). Got: ${raw.domain}`);
  const linkedin = String(raw.linkedin ?? "").trim();
  if (linkedin && !/^https:\/\//.test(linkedin)) throw new Error(`"linkedin" must start with https://`);
  const contactEmail = String(raw.contactEmail ?? "").trim();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new Error(`"contactEmail" is not an email address: ${contactEmail}`);
  const launchAt = String(raw.launchAt ?? "").trim();
  if (launchAt && (!/(Z|[+-]\d{2}:\d{2})$/.test(launchAt) || Number.isNaN(Date.parse(launchAt)))) {
    throw new Error(`"launchAt" must be a date and time with a time zone, for example 2026-11-05T09:00:00+01:00. Got: ${launchAt}`);
  }
  const place = String(raw.place ?? "Lagos").trim();
  if (!place) throw new Error(`"place" cannot be empty. It is the city shown in "built in ...", for example Enugu.`);
  const whatsapp = normalizeWhatsapp(raw.whatsapp);
  const text = encodeURIComponent("Hi Nonso, I would like to join the Prima waitlist.");
  return {
    domain,
    place,
    whatsapp,
    whatsappLink: whatsapp ? `https://wa.me/${whatsapp}?text=${text}` : "",
    linkedin,
    contactEmail,
    launchAt,
    waitlistOpens: String(raw.waitlistOpens ?? "").trim(),
  };
}

// {{#key}}shown when key is set{{/key}} and {{^key}}shown when it is not{{/key}}
export function applyConditionals(text, values) {
  let out = text;
  for (const key of Object.keys(values)) {
    const on = !!values[key];
    out = out
      .replace(new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, "g"), on ? "$1" : "")
      .replace(new RegExp(`\\{\\{\\^${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, "g"), on ? "" : "$1");
  }
  return out;
}

export function fillTokens(text, values) {
  return text.replace(/\{\{(\w+)\}\}/g, (whole, key) => (key in values ? escapeHtml(values[key]) : whole));
}

// Light CSS tidy: remove comments and extra space. Safe because the stylesheet has no strings with spaces.
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

// The security policy lists the exact inline scripts it allows, by fingerprint
export function inlineScriptHashes(html) {
  const out = [];
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) {
    out.push(`'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
  }
  return out;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

export function build({ src = join(HERE, "src"), out = join(HERE, "dist"), configPath = join(HERE, "site.config.json"), now = new Date() } = {}) {
  const cfg = readConfig(configPath);
  const stamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const values = { ...cfg, build: stamp, year: String(now.getFullYear()) };
  const sprite = readFileSync(join(src, "assets", "sprite.svg"), "utf8");

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const files = [];
  for (const file of walk(src)) {
    const rel = relative(src, file);
    if (rel === join("assets", "sprite.svg")) continue; // inlined into index.html instead
    const dest = join(out, rel);
    mkdirSync(dirname(dest), { recursive: true });
    if (!TEXT.has(extname(file)) && !file.endsWith("_headers")) {
      cpSync(file, dest);
    } else {
      files.push({ rel, dest, text: readFileSync(file, "utf8") });
    }
  }

  // the page first, because the security policy needs its inline script
  const page = files.find((f) => f.rel === "index.html");
  let pageHtml = fillTokens(applyConditionals(page.text, values), values).replace("{{SPRITE}}", sprite);
  values.cspScripts = inlineScriptHashes(pageHtml).join(" ");

  for (const f of files) {
    let t = f.rel === "index.html" ? pageHtml : fillTokens(applyConditionals(f.text, values), values);
    if (f.rel.endsWith(".css")) t = minifyCss(t);
    // _headers contains quotes that must stay as written
    if (f.rel === "_headers") t = applyConditionals(f.text, values).replace(/\{\{(\w+)\}\}/g, (w, k) => (k in values ? String(values[k]) : w));
    writeFileSync(f.dest, t);
  }
  return { cfg, out, count: files.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { cfg, out } = build();
    console.log(`Built the landing page into ${out}`);
    console.log(`  address:   ${cfg.domain}`);
    console.log(`  place:     ${cfg.place}`);
    console.log(`  WhatsApp:  ${cfg.whatsapp ? cfg.whatsappLink : "(not set, the button is hidden)"}`);
    console.log(`  LinkedIn:  ${cfg.linkedin || "(not set, the button is hidden)"}`);
    console.log(`  email:     ${cfg.contactEmail || "(not set, the button is hidden)"}`);
    console.log(`  countdown: ${cfg.launchAt || "(not set, no countdown is shown)"}`);
  } catch (e) {
    console.error(`\nCould not build: ${e.message}\n`);
    process.exit(1);
  }
}