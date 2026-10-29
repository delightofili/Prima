// Is the live site the same as the build on this PC?  node scripts/verify-deploy.mjs
// Optional: node scripts/verify-deploy.mjs https://some-other-address.pages.dev
// It only reads. It changes nothing.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const live = (process.argv[2] ?? "https://prima-test-axo.pages.dev").replace(
  /\/+$/,
  "",
);
const ok = (m) => console.log(`  OK   ${m}`);
const bad = (m) => console.log(`  NO   ${m}`);

if (!existsSync("dist/index.html")) {
  console.log("\nThere is no dist folder yet. Run:  npm run build\n");
  process.exit(1);
}

const get = async (path) => {
  try {
    const res = await fetch(
      `${live}${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`,
      { cache: "no-store" },
    );
    return { status: res.status, text: await res.text() };
  } catch (e) {
    return { status: 0, text: String(e) };
  }
};

console.log(`\nThis PC (dist folder) against ${live}\n`);
let behind = false;

// 1. the build time
const localBuild = existsSync("dist/version.json")
  ? JSON.parse(readFileSync("dist/version.json", "utf8")).build
  : null;
const page = await get("/");
const versionFile = await get("/version.json");
let liveBuild = null;
try {
  liveBuild = JSON.parse(versionFile.text).build ?? null;
} catch {
  /* not JSON: the file is missing and the site answered with its front page */
}
if (page.status === 0) {
  bad(`could not reach ${live}. Check the address and the internet.`);
  process.exit(1);
}
if (!localBuild) {
  bad(
    "dist/version.json is missing. Run  npm run build  (your vite.config.ts must have the version plugin).",
  );
} else if (!liveBuild) {
  bad(
    `the live site has no version.json. It is an old deploy, or the address is wrong. This PC's build: ${localBuild}`,
  );
  behind = true;
} else if (liveBuild === localBuild) {
  ok(`same build time on both: ${localBuild}`);
} else {
  bad(`build times differ.  This PC: ${localBuild}   Live: ${liveBuild}`);
  behind = liveBuild < localBuild;
}

// 2. the main app file the live front page points to
const main = (html) => /assets\/(index-[\w-]+\.js)/.exec(html)?.[1];
const localMain = main(readFileSync("dist/index.html", "utf8"));
const liveMain = main(page.text);
if (!liveMain) bad("the live front page does not look like Prima's");
else if (liveMain === localMain)
  ok(`the live page loads the same app file (${localMain})`);
else {
  bad(`the live page loads ${liveMain} but this PC built ${localMain}`);
  behind = true;
}

// 3. the Igbo file, which only exists since today
const igbo = existsSync("dist/assets")
  ? readdirSync("dist/assets").find((f) => /^ig-.*\.js$/.test(f))
  : undefined;
if (!igbo) {
  console.log(
    "  --   no separate Igbo file in dist (is the translation code in this build?)",
  );
} else {
  const res = await get(`/assets/${igbo}`);
  if (res.status === 200 && !res.text.trimStart().startsWith("<"))
    ok(`the live site has today's Igbo file (${igbo})`);
  else {
    bad(
      `the live site does not have ${igbo}: today's translations are not deployed`,
    );
    behind = true;
  }
}

// 4. the offline engine file must never be stored by the browser
const sw = await fetch(`${live}/sw.js`, { method: "HEAD" }).catch(() => null);
const cache = sw?.headers.get("cache-control") ?? "(none)";
console.log(
  `  --   sw.js cache rule: ${cache}${/no-cache|max-age=0/.test(cache) ? "" : "   <- should say no-cache"}`,
);

console.log(
  behind
    ? "\nVERDICT: the live site is BEHIND this PC. Run:  npm run deploy:test   then run this script again.\n"
    : "\nVERDICT: the live site is current. If the phone still shows old screens, the phone is the one behind (see the phone steps).\n",
);
process.exit(behind ? 1 : 0);
