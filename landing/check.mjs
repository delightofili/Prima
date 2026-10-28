import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = process.argv[2] ?? join(HERE, "dist");
const problems = [];
const err = (m) => problems.push(["ERROR", m]);
const warn = (m) => problems.push(["WARN", m]);
const read = (f) => readFileSync(join(DIST, f), "utf8");

// ---- files
for (const f of [
  "index.html",
  "privacy.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "favicon.svg",
  "apple-touch-icon.png",
  "og.png",
  "assets/styles.css",
  "assets/app.js",
]) {
  if (!existsSync(join(DIST, f)))
    err(`missing file: ${f}. Run: node build.mjs`);
}
if (problems.length) report();

const html = read("index.html");
const css = read("assets/styles.css");
const js = read("assets/app.js");
const headers = read("_headers");

// ---- reading tags the way a browser does: any attribute order, spacing or line breaks
// (an editor that formats on save, such as Prettier, spreads a long tag over several lines)
const tagsOf = (name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => m[0]);
const attr = (tag, a) =>
  new RegExp(`\\b${a}\\s*=\\s*"([^"]*)"`, "i").exec(tag)?.[1];
const metaContent = (key, value) => {
  const tag = tagsOf("meta").find((t) => attr(t, key) === value);
  return tag === undefined ? null : (attr(tag, "content") ?? "");
};

// ---- search and sharing
const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
if (!title) err("the page has no <title>");
else if (title.length > 65)
  warn(
    `the title is ${title.length} characters; search results cut it near 60`,
  );
const desc = metaContent("name", "description");
if (!desc) err("no meta description");
else if (desc.length > 165)
  warn(
    `the description is ${desc.length} characters; search results cut it near 160`,
  );
for (const needle of [
  '<html lang="',
  'name="viewport"',
  'rel="canonical"',
  'property="og:title"',
  'property="og:description"',
  'property="og:image"',
  'name="twitter:card"',
  'name="theme-color"',
]) {
  if (!html.includes(needle)) err(`missing ${needle}`);
}
const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
if (h1s !== 1) err(`the page should have exactly one <h1>, it has ${h1s}`);
for (const m of html.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
)) {
  try {
    JSON.parse(m[1]);
  } catch {
    err("the JSON-LD block is not valid JSON");
  }
}
const canonical =
  attr(
    tagsOf("link").find((t) => attr(t, "rel") === "canonical") ?? "",
    "href",
  ) ?? "";
const ogImage = metaContent("property", "og:image") ?? "";
if (!/^https:\/\//.test(ogImage))
  err(
    "og:image must be a full https address, or WhatsApp and LinkedIn will show no picture",
  );
if (canonical.endsWith(".pages.dev/"))
  warn(
    "the address is still the free pages.dev one. After you buy a domain, set it in site.config.json and build again.",
  );

// ---- unfinished business
for (const f of [
  "index.html",
  "privacy.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "_headers",
]) {
  const t = read(f);
  if (/\{\{[^}]+\}\}/.test(t)) err(`${f} still has an unfilled {{token}}`);
  if (/TODO|lorem ipsum/i.test(t))
    err(`${f} still has a TODO or placeholder text`);
}

// ---- links and anchors
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const seen = new Set();
for (const id of ids) {
  if (seen.has(id)) err(`duplicate id: ${id}`);
  seen.add(id);
}
for (const m of html.matchAll(/href="#([^"]+)"/g))
  if (!seen.has(m[1])) err(`a link goes to #${m[1]} but nothing has that id`);
for (const m of html.matchAll(/<use href="#([^"]+)"/g))
  if (!seen.has(m[1]) && !html.includes(`id="${m[1]}"`))
    err(`an icon is missing from the sprite: ${m[1]}`);
for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:\?[^"]*)?"/g)) {
  const p = m[1] === "/" ? "index.html" : m[1].slice(1);
  if (!existsSync(join(DIST, p)))
    err(`a link or file points to ${m[1]} which is not in dist`);
}
for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  if (!/\balt="/.test(m[0])) err("an image has no alt text");
  if (!/\bwidth="/.test(m[0]) || !/\bheight="/.test(m[0]))
    warn("an image has no width and height, so the page may jump as it loads");
}

// ---- nothing from other websites (speed and privacy)
for (const m of html.matchAll(
  /<(script|link|img|iframe|source|video|audio)\b[^>]*\b(?:src|href)="(https?:)?\/\/[^"]+"/g,
)) {
  if (m[1] === "link" && /rel="(canonical|preconnect)"/.test(m[0])) continue;
  if (/rel="canonical"/.test(m[0])) continue;
  err(`the page loads something from another website: ${m[0].slice(0, 90)}`);
}
if (/url\(\s*['"]?https?:/.test(css))
  err("the stylesheet loads something from another website");
if (/\bfetch\(|XMLHttpRequest|sendBeacon/.test(js))
  err("the script makes network requests; the page promises it makes none");

// ---- a way for visitors to reach you
const hasContact =
  /href="https:\/\/wa\.me\//.test(html) ||
  /href="mailto:/.test(html) ||
  /linkedin\.com/.test(html);
if (!hasContact)
  err(
    "no way to reach you is set. Add whatsapp, linkedin or contactEmail in site.config.json and build again.",
  );

// ---- the security policy lists this page's inline scripts exactly
const inline = [
  ...html.matchAll(
    /<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g,
  ),
].map((m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
for (const h of inline)
  if (!headers.includes(h))
    err(
      "an inline script is not allowed by the security policy in _headers. Run: node build.mjs",
    );
if (/\sstyle="/.test(html))
  err(
    "the page has an inline style attribute, which the security policy blocks",
  );

// ---- colour contrast (WCAG AA wants 4.5 for normal text)
const vars = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})/gi)].map((m) => [
    m[1],
    m[2],
  ]),
);
const lum = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const pairs = [
  ["text on the page", vars.ink, vars.sand],
  ["grey text on the page", vars.sub, vars.sand],
  ["grey text on white", vars.sub, vars.white ?? "#fff"],
  ["white on teal", "#fff", vars.teal],
  ["teal links on the page", vars.teal, vars.sand],
  ["teal on white", vars.teal, "#fff"],
  ["white on dark teal", "#fff", vars["teal-dark"]],
  ["light teal on dark teal", vars["teal-light"], vars["teal-dark"]],
  ["light teal on teal", vars["teal-light"], vars.teal],
  ["dark teal on light teal", vars["teal-dark"], vars["teal-light"]],
  ["text on the orange", vars.ink, vars.accent],
  ["text in the warning box", "#451a03", "#fef3c7"],
  ["text on the Coming tag", "#78350f", "#fef3c7"],
  ["text on the footer", "#d6d3d1", vars.ink],
];
for (const [name, fg, bg] of pairs) {
  if (!fg || !bg) {
    warn(`could not check contrast: ${name}`);
    continue;
  }
  const r = ratio(fg, bg);
  if (r < 4.5) err(`low contrast (${r.toFixed(2)}:1) for ${name}`);
}

// ---- weight
const gz = (t) => gzipSync(Buffer.from(t)).length;
const first = gz(html) + gz(css) + gz(js);
const all = (dir) =>
  readdirSync(dir).flatMap((n) =>
    statSync(join(dir, n)).isDirectory() ? all(join(dir, n)) : [join(dir, n)],
  );
const total = all(DIST).reduce((s, f) => s + statSync(f).size, 0);
if (first > 60_000)
  err(
    `the first load is ${(first / 1024).toFixed(1)} KB compressed; the budget is 60 KB`,
  );
else if (first > 40_000)
  warn(
    `the first load is ${(first / 1024).toFixed(1)} KB compressed (aim for under 40 KB)`,
  );

function report() {
  const errors = problems.filter((p) => p[0] === "ERROR");
  console.log("\nPrima landing page check\n");
  for (const [level, m] of problems)
    console.log(`${level === "ERROR" ? "ERROR" : "warn "}  ${m}`);
  if (typeof first === "number") {
    console.log(
      `\nFirst load, compressed: HTML ${(gz(html) / 1024).toFixed(1)} KB + CSS ${(gz(css) / 1024).toFixed(1)} KB + JS ${(gz(js) / 1024).toFixed(1)} KB = ${(first / 1024).toFixed(1)} KB. Requests: HTML, CSS, JS, icon. No images, no fonts, no other websites.`,
    );
    console.log(
      `Everything in dist: ${(total / 1024).toFixed(0)} KB (the share picture og.png is only fetched by WhatsApp, LinkedIn and X, not by visitors).`,
    );
  }
  console.log(
    errors.length
      ? `\n${errors.length} problem(s) to fix before deploying.\n`
      : "\nReady to deploy.\n",
  );
  process.exit(errors.length ? 1 : 0);
}
report();
