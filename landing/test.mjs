// Tests for the build and the check: node --test
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CHECK = fileURLToPath(new URL("./check.mjs", import.meta.url));
import { applyConditionals, build, fillTokens, inlineScriptHashes, minifyCss, normalizeWhatsapp, readConfig } from "./build.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "prima-landing-"));
const configFile = (obj) => { const p = join(tmp(), "c.json"); writeFileSync(p, JSON.stringify(obj)); return p; };
const GOOD = { domain: "https://prima.com.ng", whatsapp: "0803 123 4567", linkedin: "https://www.linkedin.com/in/example", contactEmail: "hello@prima.com.ng", launchAt: "2026-11-05T09:00:00+01:00", waitlistOpens: "on Monday 2 November" };

test("WhatsApp numbers in every usual style become international digits", () => {
  for (const n of ["08031234567", "0803 123 4567", "+234 803 123 4567", "2348031234567", "8031234567", "(0803) 123-4567"]) assert.equal(normalizeWhatsapp(n), "2348031234567", n);
  assert.equal(normalizeWhatsapp("+1 415 555 2671"), "14155552671");
  assert.equal(normalizeWhatsapp(""), "");
  assert.throws(() => normalizeWhatsapp("12345"));
  assert.throws(() => normalizeWhatsapp("0803"));
});

test("the config is checked, with clear messages", () => {
  assert.equal(readConfig(configFile({ domain: "https://prima.com.ng/" })).domain, "https://prima.com.ng");
  assert.throws(() => readConfig(configFile({ domain: "http://prima.com.ng" })), /domain/);
  assert.throws(() => readConfig(configFile({ domain: "prima.com.ng" })), /domain/);
  assert.throws(() => readConfig(configFile({ domain: "https://prima.com.ng/path" })), /domain/);
  assert.throws(() => readConfig(configFile({ ...GOOD, contactEmail: "not an email" })), /contactEmail/);
  assert.throws(() => readConfig(configFile({ ...GOOD, linkedin: "linkedin.com/in/x" })), /linkedin/);
  assert.throws(() => readConfig(configFile({ ...GOOD, launchAt: "2026-11-05T09:00:00" })), /launchAt/); // no time zone
  assert.throws(() => readConfig(configFile({ ...GOOD, launchAt: "soon" })), /launchAt/);
  assert.equal(readConfig(configFile(GOOD)).whatsapp, "2348031234567");
  assert.match(readConfig(configFile(GOOD)).whatsappLink, /^https:\/\/wa\.me\/2348031234567\?text=Hi%20Nonso/);
});

test("conditional blocks show or hide, and values cannot break the page", () => {
  const t = "A{{#x}}[on {{x}}]{{/x}}B{{^x}}[off]{{/x}}C";
  assert.equal(applyConditionals(t, { x: "yes" }), "A[on {{x}}]BC");
  assert.equal(applyConditionals(t, { x: "" }), "AB[off]C");
  assert.equal(fillTokens('<a href="{{u}}">', { u: 'x" onclick="evil' }), '<a href="x&quot; onclick=&quot;evil">');
  assert.equal(fillTokens("{{unknown}}", {}), "{{unknown}}");
});

test("the stylesheet is tidied without changing its meaning", () => {
  assert.equal(minifyCss("/* c */ a  {\n color : red;\n  margin: 0 auto;\n}\n\n b > c , d { x: 1; }"), "a{color : red;margin: 0 auto}b>c,d{x: 1}");
});

test("only the page's own inline script is fingerprinted", () => {
  const h = '<script>one()</script><script src="/a.js"></script><script type="application/ld+json">{"a":1}</script>';
  assert.deepEqual(inlineScriptHashes(h), [`'sha256-${createHash("sha256").update("one()").digest("base64")}'`]);
});

test("a fully set up build has contact buttons, a countdown and a matching security policy", () => {
  const out = tmp();
  build({ out, configPath: configFile(GOOD), now: new Date("2026-10-27T10:00:00Z") });
  const html = readFileSync(join(out, "index.html"), "utf8");
  assert.match(html, /href="https:\/\/wa\.me\/2348031234567\?text=/);
  assert.match(html, /href="https:\/\/www\.linkedin\.com\/in\/example"/);
  assert.match(html, /href="mailto:hello@prima\.com\.ng"/);
  assert.match(html, /data-launch="2026-11-05T09:00:00\+01:00"/);
  assert.match(html, /id="countdown"/);
  assert.match(html, /The waitlist form opens on Monday 2 November\./);
  assert.match(html, /<link rel="canonical" href="https:\/\/prima\.com\.ng\/">/);
  assert.match(html, /og:image" content="https:\/\/prima\.com\.ng\/og\.png"/);
  assert.match(html, /styles\.css\?v=202610271000/);
  assert.ok(html.includes('<symbol id="i-wifi-off"'), "icons are inlined");
  assert.ok(!html.includes("{{"));
  assert.match(readFileSync(join(out, "sitemap.xml"), "utf8"), /<loc>https:\/\/prima\.com\.ng\/<\/loc>/);
  assert.match(readFileSync(join(out, "robots.txt"), "utf8"), /Sitemap: https:\/\/prima\.com\.ng\/sitemap\.xml/);
  const hash = createHash("sha256").update('document.documentElement.classList.add("js")').digest("base64");
  assert.ok(readFileSync(join(out, "_headers"), "utf8").includes(`'sha256-${hash}'`), "the security policy allows exactly the inline script");
  const r = spawnSync("node", [CHECK, out], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /Ready to deploy/);
});

test("an unset build hides the buttons and the countdown, and the check refuses to pass it", () => {
  const out = tmp();
  build({ out, configPath: configFile({ domain: "https://prima.com.ng" }) });
  const html = readFileSync(join(out, "index.html"), "utf8");
  assert.ok(!html.includes("wa.me") && !html.includes("mailto:") && !html.includes('id="countdown"'));
  assert.match(html, /The waitlist form opens in a few days\./);
  const r = spawnSync("node", [CHECK, out], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /no way to reach you/);
});

test("the check catches the mistakes it exists for", () => {
  const out = tmp();
  build({ out, configPath: configFile(GOOD) });
  const html = readFileSync(join(out, "index.html"), "utf8");
  const bad = (edit, expected) => {
    writeFileSync(join(out, "index.html"), edit(html));
    const r = spawnSync("node", [CHECK, out], { encoding: "utf8" });
    assert.equal(r.status, 1, expected);
    assert.match(r.stdout, expected);
  };
  bad((h) => h.replace('href="#faq"', 'href="#nowhere"'), /nothing has that id/);
  bad((h) => h.replace("</body>", '<script src="https://evil.example/x.js"></script></body>'), /another website/);
  bad((h) => h.replace("</body>", "<p>TODO write this</p></body>"), /TODO/);
  bad((h) => h.replace("</body>", '<img src="/og.png">'), /alt text/);
  bad((h) => h.replace("</body>", '<p style="color:red">x</p></body>'), /inline style/);
  bad((h) => h.replace('<script>document.documentElement.classList.add("js")</script>', "<script>alert(1)</script>"), /security policy/);
  bad((h) => h.replace('<use href="#i-wifi-off"/>', '<use href="#i-nope"/>'), /missing from the sprite/);
});
