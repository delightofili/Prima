// Day 27 checks for the crash log: what is kept, what is thrown away, and that nothing here can crash the app a second time.
import {
  MAX_CRASHES,
  clearCrashes,
  crashReport,
  describeCrash,
  installGlobalCapture,
  isNoise,
  isStaleBundleError,
  readCrashes,
  recordCrash,
  safePath,
  scrub,
  toError,
} from "../src/lib/crashLog";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};

// A pretend phone: its storage can be made to fail, and the screen has an address
class Store {
  map = new Map<string, string>();
  broken = false;
  getItem(k: string) {
    if (this.broken) throw new Error("storage is blocked");
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.broken) throw new Error("QuotaExceededError");
    this.map.set(k, v);
  }
  removeItem(k: string) {
    if (this.broken) throw new Error("storage is blocked");
    this.map.delete(k);
  }
}
const store = new Store();
Object.defineProperty(globalThis, "localStorage", {
  value: store,
  configurable: true,
});
Object.defineProperty(globalThis, "location", {
  value: { pathname: "/patients/9f1c2e44-aaaa-4bbb-8ccc-1234567890ab" },
  configurable: true,
  writable: true,
});
const reset = () => {
  store.broken = false;
  store.map.clear();
};
const err = (message: string, name = "Error") =>
  Object.assign(new Error(message), { name });

/* ---------- taking out what could identify someone ---------- */
const dirty =
  "Could not save Ngozi 08031234567 (ngozi.eze@example.com) id 9f1c2e44-aaaa-4bbb-8ccc-1234567890ab at /card?num=ANK12345678&x=1";
const clean = scrub(dirty);
ok(
  "a phone number, an email, an id and a query string are all taken out",
  !/0803123|ngozi\.eze|9f1c2e44|ANK12345678/.test(clean) &&
    /\[number\]/.test(clean) &&
    /\[email\]/.test(clean) &&
    /\[id\]/.test(clean) &&
    clean.includes("?…"),
  clean,
);
ok(
  "short numbers (line numbers, counts) and words are kept",
  scrub("at render (index-Cx8.js:123:45) 3 of 7 failed") ===
    "at render (index-Cx8.js:123:45) 3 of 7 failed",
);
ok("long text is cut to the limit", scrub("x".repeat(1000), 50).length === 50);
ok(
  "an id in the screen's address becomes :id, and the query and # are dropped",
  safePath("/patients/9f1c2e44-aaaa-4bbb-8ccc-1234567890ab") ===
    "/patients/:id" &&
    safePath("/card/08031234567?x=1#top") === "/card/:id" &&
    safePath("/dashboard?tab=billing&reference=prima_abc") === "/dashboard",
);
ok(
  "ordinary addresses are unchanged, and a huge segment is clipped",
  safePath("/dashboard") === "/dashboard" &&
    safePath("/") === "/" &&
    safePath("/" + "a".repeat(200)).length <= 121,
);

/* ---------- what counts as a crash ---------- */
for (const m of [
  "Failed to fetch dynamically imported module: https://x/assets/Plans-ab12.js",
  "error loading dynamically imported module",
  "Importing a module script failed.",
  "Loading chunk 12 failed.",
  "Unable to preload CSS for /assets/x.css",
]) {
  ok(
    `an update that left a file missing is recognised: "${m.slice(0, 45)}"`,
    isStaleBundleError(err(m)),
  );
}
ok(
  "an ordinary error is not mistaken for an update",
  !isStaleBundleError(err("Cannot read properties of undefined")) &&
    !isStaleBundleError(undefined),
);
ok(
  "normal offline-app events are not crashes: no signal, a script from another site, the person moving on, a layout notice",
  isNoise(err("Failed to fetch")) &&
    isNoise(err("NetworkError when attempting to fetch resource")) &&
    isNoise(err("Load failed")) &&
    isNoise(err("Script error.")) &&
    isNoise(err("x", "AbortError")) &&
    isNoise(
      err("ResizeObserver loop completed with undelivered notifications."),
    ),
);
ok(
  "a browser extension's error is not ours",
  isNoise(
    Object.assign(err("boom"), {
      stack: "Error: boom\n at chrome-extension://abc/content.js:1:1",
    }),
  ),
);
ok(
  "a missing file after an update is NEVER treated as 'no signal', even though it says 'Failed to fetch'",
  !isNoise(err("Failed to fetch dynamically imported module: https://x/a.js")),
);
ok(
  "a real bug is a crash",
  !isNoise(
    err("Cannot read properties of undefined (reading 'name')", "TypeError"),
  ),
);
ok(
  "anything thrown becomes an error we can describe",
  toError("plain words").message === "plain words" &&
    toError(42).name === "NonError" &&
    toError(null) instanceof Error &&
    toError(err("e")).message === "e",
);

/* ---------- describing is not keeping ---------- */
reset();
const d = describeCrash(
  err("Could not save 08031234567 for ngozi@example.com"),
  "screen",
  1000,
);
ok(
  "describing a crash keeps nothing (safe while a screen is drawing)",
  readCrashes().length === 0 && store.map.size === 0,
);
ok(
  "the description holds no phone number, no email and no id",
  !/0803123|ngozi@|9f1c2e44/.test(JSON.stringify(d)) &&
    d.path === "/patients/:id",
);
ok(
  "it has the time, where it happened, and a stack of at most 8 lines",
  d.at === 1000 && d.where === "screen" && d.stack.split("\n").length <= 8,
);

/* ---------- keeping it ---------- */
reset();
recordCrash(err("first"), "screen", 100_000);
recordCrash(err("second"), "script", 200_000);
const kept = readCrashes();
ok(
  "crashes are kept, newest first",
  kept.length === 2 &&
    kept[0].message === "second" &&
    kept[1].message === "first",
);
recordCrash(err("second"), "script", 202_000);
ok(
  "the same crash twice within 5 seconds is kept once",
  readCrashes().length === 2,
);
recordCrash(err("second"), "script", 210_000);
ok("the same crash a little later is kept again", readCrashes().length === 3);
reset();
for (let i = 0; i < 35; i++)
  recordCrash(err(`crash number ${i}`), "screen", 1_000_000 + i * 60_000);
const ring = readCrashes();
ok(
  `only the newest ${MAX_CRASHES} are kept, so the log can never fill a phone`,
  ring.length === MAX_CRASHES &&
    ring[0].message === "crash number 34" &&
    ring[MAX_CRASHES - 1].message === "crash number 15",
);
clearCrashes();
ok("it can be cleared", readCrashes().length === 0);

/* ---------- when the phone itself misbehaves ---------- */
store.broken = true;
let threw = false;
let returned = false;
try {
  returned =
    recordCrash(err("while storage is full"), "screen").message ===
    "while storage is full";
} catch {
  threw = true;
}
ok(
  "if storage is full or blocked, recording a crash does not throw, and the crash is still returned",
  !threw && returned,
);
ok(
  "reading from blocked storage gives an empty log, not a second crash",
  readCrashes().length === 0,
);
let clearThrew = false;
try {
  clearCrashes();
} catch {
  clearThrew = true;
}
ok("clearing blocked storage does not throw either", !clearThrew);
reset();
store.map.set("prima_crashes", "{not json");
ok("a damaged log reads as empty", readCrashes().length === 0);
store.map.set("prima_crashes", '{"a":1}');
ok("a log that is not a list reads as empty", readCrashes().length === 0);
store.map.set(
  "prima_crashes",
  JSON.stringify([
    null,
    5,
    "x",
    { at: "no" },
    { at: 1, name: "E", message: "good", path: "/" },
  ]),
);
const odd = readCrashes();
ok(
  "odd entries are skipped and a good one is kept with safe defaults",
  odd.length === 1 &&
    odd[0].message === "good" &&
    odd[0].stack === "" &&
    odd[0].where === "screen" &&
    odd[0].stale === false,
);

/* ---------- the text sent to support ---------- */
const rep = crashReport(
  describeCrash(
    err(
      "Failed to fetch dynamically imported module: https://x.pages.dev/assets/Plans.js?v=123456789",
    ),
    "screen",
    Date.parse("2026-11-05T08:00:00Z"),
  ),
  "Mozilla/5.0 (Linux; Android 13; TECNO KG5k) Chrome/129 ?x=987654321",
);
ok(
  "the report says what, when, where and which version",
  /Prima crash report/.test(rep) &&
    /2026-11-05T08:00:00\.000Z/.test(rep) &&
    /Screen: \/patients\/:id/.test(rep) &&
    /Version: dev/.test(rep),
);
ok(
  "it says when the cause was an update, and says it holds no patient information",
  /updated while open/.test(rep) && /holds no patient information/.test(rep),
);
ok(
  "the report has no long numbers and no query strings",
  !/\d{6,}/.test(rep) && !/\?v=/.test(rep),
);
ok(
  "the browser line is there for support, scrubbed",
  /Browser: Mozilla/.test(rep) && !/987654321/.test(rep),
);

/* ---------- listening for what no screen caught ---------- */
reset();
const win = new EventTarget();
const fire = (
  type: "error" | "unhandledrejection",
  payload: Record<string, unknown>,
) => {
  const ev = new Event(type);
  Object.assign(ev, payload);
  win.dispatchEvent(ev);
};
const off = installGlobalCapture(win as unknown as Window);
fire("error", {
  error: err("a script broke", "TypeError"),
  message: "a script broke",
});
fire("unhandledrejection", { reason: err("a promise was dropped") });
const two = readCrashes();
ok(
  "an error nobody caught is kept as 'script', and a dropped promise as 'promise'",
  two.length === 2 &&
    two.some((c) => c.where === "script" && c.message === "a script broke") &&
    two.some((c) => c.where === "promise"),
);
fire("error", { message: "Script error." });
fire("error", { error: err("Failed to fetch"), message: "Failed to fetch" });
fire("unhandledrejection", { reason: err("aborted", "AbortError") });
ok(
  "noise (another site's script, no signal, the person moving on) is not kept",
  readCrashes().length === 2,
);
fire("unhandledrejection", { reason: "just a string" });
ok(
  "something that is not an Error still gets a record",
  readCrashes().length === 3,
);
off();
reset();
const loopWin = new EventTarget(); // a new listener, started while the clock is faked, so earlier events do not count against it
const realNow = Date.now;
let t = 5_000_000;
Date.now = () => t;
const offLoop = installGlobalCapture(loopWin as unknown as Window);
for (let i = 0; i < 12; i++) {
  t += 1000; // twelve different crashes in twelve seconds
  const ev = new Event("error");
  Object.assign(ev, { error: err(`loop crash ${i}`), message: "x" });
  loopWin.dispatchEvent(ev);
}
t += 61_000; // a minute later, a new crash is allowed again
const later = new Event("error");
Object.assign(later, { error: err("a minute later"), message: "x" });
loopWin.dispatchEvent(later);
Date.now = realNow;
ok(
  "a crash that repeats in a loop keeps at most 5 a minute",
  readCrashes().filter((c) => c.message.startsWith("loop crash")).length === 5,
);
ok(
  "and after a minute a new one is kept again",
  readCrashes().some((c) => c.message === "a minute later"),
);
offLoop();
reset();
const off2 = installGlobalCapture(win as unknown as Window);
off2();
reset();
fire("error", { error: err("after switching off") });
ok("once switched off, nothing more is kept", readCrashes().length === 0);

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
