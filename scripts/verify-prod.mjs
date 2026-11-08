// Checks the LIVE site. It only reads; it changes nothing.
//   npm run verify:prod                          the app    (https://app.primahealth.com.ng)
//   npm run verify:prod -- --landing             the landing page (https://primahealth.com.ng)
//   npm run verify:prod -- https://other.address any address
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const APP = "https://app.primahealth.com.ng";
export const LANDING = "https://primahealth.com.ng";
const refOf = (url) =>
  /^https:\/\/([a-z0-9]{15,30})\.supabase\.co/.exec(url ?? "")?.[1] ?? null;
const readRef = (file, key) => {
  if (!existsSync(file)) return null;
  const m = new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`, "m").exec(
    readFileSync(file, "utf8"),
  );
  return m ? refOf(m[1].replace(/^['"]|['"]$/g, "")) : null;
};

// Runs every check and returns [{ ok, label, hint }]. "get" is fetch, so a test can pretend to be the internet.
export async function check(
  live,
  { landing = false, get = fetch, prodRef = null, testRef = null } = {},
) {
  const out = [];
  const add = (ok, label, hint = "") => out.push({ ok, label, hint });
  const https = live.startsWith("https://");
  const fetchPath = async (path, opts = {}) => {
    try {
      const res = await get(`${live}${path}`, { cache: "no-store", ...opts });
      return { res, text: opts.redirect === "manual" ? "" : await res.text() };
    } catch (e) {
      return { res: null, text: String(e) };
    }
  };

  const home = await fetchPath("/");
  if (!home.res) {
    add(
      false,
      `could not reach ${live}`,
      "Check the address, the internet, and that the domain is Active in Cloudflare.",
    );
    return out;
  }
  add(
    home.res.status === 200,
    `the front page answers (HTTP ${home.res.status})`,
    "A 522 or 525 means the custom domain is not attached to the Pages project yet.",
  );
  if (https) add(true, "the HTTPS certificate is accepted");

  if (https) {
    try {
      const r = await get(live.replace("https://", "http://") + "/", {
        redirect: "manual",
        cache: "no-store",
      });
      const to = r.headers.get("location") ?? "";
      add(
        [301, 302, 307, 308].includes(r.status) && to.startsWith("https://"),
        `plain http:// sends people to https:// (HTTP ${r.status})`,
        'In Cloudflare: SSL/TLS, Edge Certificates, switch on "Always Use HTTPS".',
      );
    } catch {
      add(
        false,
        "plain http:// could not be tested",
        'In Cloudflare: SSL/TLS, Edge Certificates, switch on "Always Use HTTPS".',
      );
    }
  }

  const h = (name) => home.res.headers.get(name) ?? "";
  add(
    /nosniff/i.test(h("x-content-type-options")),
    "header: X-Content-Type-Options is nosniff",
    "The _headers file did not deploy.",
  );
  add(h("referrer-policy") !== "", "header: Referrer-Policy is set");
  add(
    /frame-ancestors/i.test(h("content-security-policy")) ||
      /DENY|SAMEORIGIN/i.test(h("x-frame-options")),
    "header: the page cannot be put inside another site's frame",
  );
  add(
    h("content-security-policy") !== "" ||
      h("content-security-policy-report-only") !== "",
    "header: a Content-Security-Policy is present (enforcing or report-only)",
  );
  if (https)
    add(
      /max-age=\d{6,}/.test(h("strict-transport-security")),
      "header: Strict-Transport-Security remembers HTTPS",
    );

  if (!landing) {
    add(
      /noindex/i.test(h("x-robots-tag")),
      "header: the app is hidden from search engines (X-Robots-Tag noindex)",
    );
    add(
      /camera=\(self\)/.test(h("permissions-policy")),
      "header: the camera is allowed for the app (QR scanning), not for other sites",
    );
    add(/id="root"/.test(home.text), "the front page is the Prima app");

    const sw = await fetchPath("/sw.js");
    add(
      sw.res?.status === 200 &&
        /no-cache|max-age=0|no-store/.test(
          sw.res.headers.get("cache-control") ?? "",
        ),
      "the offline worker (sw.js) is never stored by the browser",
      "Phones would stay on an old version.",
    );
    const ver = await fetchPath("/version.json");
    let build = null;
    try {
      build = JSON.parse(ver.text).build ?? null;
    } catch {
      /* not JSON */
    }
    add(
      !!build && /no-store/.test(ver.res?.headers.get("cache-control") ?? ""),
      `version.json answers${build ? ` (build ${build})` : ""} and is never stored`,
    );
    const man = await fetchPath("/manifest.webmanifest");
    let manifest = null;
    try {
      manifest = JSON.parse(man.text);
    } catch {
      /* not JSON */
    }
    add(
      /manifest\+json/.test(man.res?.headers.get("content-type") ?? "") &&
        manifest?.start_url === "/",
      "the install manifest is served correctly (people can install the app)",
    );
    const deep = await fetchPath("/register");
    add(
      deep.res?.status === 200 && /id="root"/.test(deep.text),
      "a deep link such as /register opens the app (a refresh does not give a 404)",
    );

    const asset = /\/assets\/(index-[\w-]+\.js)/.exec(home.text)?.[0];
    if (!asset) add(false, "the front page names no app file");
    else {
      const js = await fetchPath(asset);
      add(
        js.res?.status === 200 && !js.text.trimStart().startsWith("<"),
        `the app file loads (${asset})`,
      );
      add(
        /immutable/.test(js.res?.headers.get("cache-control") ?? ""),
        "the app file is stored for a year (its name changes with every build)",
      );
      if (prodRef)
        add(
          js.text.includes(`${prodRef}.supabase.co`),
          `the live app talks to the PRODUCTION database (${prodRef})`,
          "It was built with the wrong settings. Deploy again with npm run deploy:prod.",
        );
      if (testRef && testRef !== prodRef)
        add(
          !js.text.includes(`${testRef}.supabase.co`),
          "the live app does NOT contain the TEST database address",
          "STOP: real patients would go to the test database. Deploy again with npm run deploy:prod.",
        );
      add(
        !/sk_(live|test)_[A-Za-z0-9]{10,}|sb_secret_[A-Za-z0-9_-]{10,}/.test(
          js.text,
        ),
        "no secret key inside the live app file",
      );
    }
  } else {
    const origin = live.replace(/\/$/, "");
    const attr = (tagPattern, name) =>
      new RegExp(`${name}="([^"]*)"`).exec(
        new RegExp(tagPattern).exec(home.text)?.[0] ?? "",
      )?.[1] ?? "";
    const canon = attr('<link[^>]*rel="canonical"[^>]*>', "href");
    add(
      canon.replace(/\/$/, "") === origin,
      `the canonical address is ${origin} (found: ${canon || "none"})`,
      "Set domain in landing/site.config.json, then npm run build again.",
    );
    add(
      !/pages\.dev/.test(home.text),
      "the page does not mention a pages.dev address",
      "site.config.json still has the old address.",
    );
    const og = attr('<meta[^>]*property="og:image"[^>]*>', "content");
    add(
      og.startsWith(origin),
      "the share picture address is on your domain",
      "A LinkedIn post would show no picture.",
    );
    const sm = await fetchPath("/sitemap.xml");
    add(
      sm.res?.status === 200 &&
        sm.text.includes(origin) &&
        !/pages\.dev/.test(sm.text),
      "sitemap.xml lists your domain",
    );
    const rb = await fetchPath("/robots.txt");
    add(
      rb.res?.status === 200 && !/pages\.dev/.test(rb.text),
      "robots.txt has no old address",
    );
  }
  return out;
}

export async function main(argv = process.argv.slice(2), opts = {}) {
  const landing = argv.includes("--landing");
  const live = (
    argv.find((a) => a.startsWith("http")) ?? (landing ? LANDING : APP)
  ).replace(/\/+$/, "");
  const prodRef =
    opts.prodRef ?? readRef(".env.prod.local", "VITE_SUPABASE_URL");
  const testRef = opts.testRef ?? readRef(".env.local", "VITE_SUPABASE_URL");
  console.log(`\nChecking ${live}${landing ? " (landing page)" : ""}\n`);
  const results = await check(live, {
    landing,
    prodRef,
    testRef,
    get: opts.get ?? fetch,
  });
  for (const r of results)
    console.log(
      `  ${r.ok ? "OK" : "NO"}  ${r.label}${!r.ok && r.hint ? `\n        ${r.hint}` : ""}`,
    );
  const bad = results.filter((r) => !r.ok).length;
  console.log(
    bad
      ? `\n${bad} problem${bad === 1 ? "" : "s"}. Fix the lines marked NO, then run this again.\n`
      : "\nAll good.\n",
  );
  return bad ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(await main());
