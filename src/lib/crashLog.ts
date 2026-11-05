// What Prima remembers when something breaks: enough for a person to help, and never anything about a patient.
// It stays on this phone. Nothing is sent anywhere: the person chooses to copy it and send it to support.

export interface Crash {
  at: number;
  where: "screen" | "script" | "promise"; // a screen failed to draw, a script threw, a promise was rejected and nobody handled it
  name: string;
  message: string;
  stack: string;
  path: string; // the screen's address with the ids taken out, for example /patients/:id
  build: string;
  stale: boolean; // the app was updated while this page was open, so a file it needed is gone
}

const KEY = "prima_crashes";
export const MAX_CRASHES = 20; // the oldest are forgotten beyond this
const QUIET_MS = 5_000; // the same crash twice within this time is recorded once
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

declare const __BUILD__: string | undefined;
const build = () => (typeof __BUILD__ === "string" ? __BUILD__ : "dev");

// Takes out what could identify a person or a record: emails, ids, long numbers (phones, card numbers), query strings.
// A NAME inside an error message cannot be recognised, which is why the log is never sent anywhere by itself.
export function scrub(text: string, max = 300): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(UUID, "[id]")
    .replace(/\d{6,}/g, "[number]")
    .replace(/\?[^\s)'"]*/g, "?…")
    .slice(0, max);
}

// /patients/9f1c… becomes /patients/:id. The query string and the part after # are dropped.
export function safePath(pathname: string): string {
  const clean = pathname.split(/[?#]/)[0] || "/";
  return clean
    .split("/")
    .map((seg) =>
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{6,})$/i.test(
        seg,
      )
        ? ":id"
        : seg.slice(0, 40),
    )
    .join("/")
    .slice(0, 120);
}

// The app was updated while this page was open: the file a screen needs no longer exists on the server
export function isStaleBundleError(e: unknown): boolean {
  const text = `${(e as Error)?.name ?? ""} ${(e as Error)?.message ?? ""}`;
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk .* failed|Unable to preload CSS/i.test(
    text,
  );
}

// Things that are normal life for an offline app, or not ours: they are not crashes
export function isNoise(e: unknown): boolean {
  if (isStaleBundleError(e)) return false;
  const err = e as Error | undefined;
  const text = `${err?.name ?? ""} ${err?.message ?? ""}`;
  if (/ResizeObserver loop/i.test(text)) return true;
  if (/^\s*Script error\.?\s*$/i.test(err?.message ?? "")) return true; // a script from another site: nothing can be learned from it
  if (err?.name === "AbortError") return true; // the person moved on while something was loading
  if (
    /Failed to fetch|NetworkError|Load failed|network request failed/i.test(
      text,
    )
  )
    return true; // no signal
  if (/(chrome|moz|safari-web)-extension:\/\//.test(err?.stack ?? ""))
    return true; // a browser extension, not Prima
  return false;
}

export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  const e = new Error(
    typeof value === "string"
      ? value
      : "A promise was rejected with something that is not an error",
  );
  e.name = "NonError";
  return e;
}

export function readCrashes(): Crash[] {
  try {
    const raw = JSON.parse(
      globalThis.localStorage?.getItem(KEY) ?? "[]",
    ) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (c): c is Crash =>
          !!c &&
          typeof c.at === "number" &&
          typeof c.name === "string" &&
          typeof c.message === "string" &&
          typeof c.path === "string",
      )
      .map((c) => ({
        ...c,
        stack: typeof c.stack === "string" ? c.stack : "",
        build: typeof c.build === "string" ? c.build : "",
        where: c.where ?? "screen",
        stale: !!c.stale,
      }))
      .slice(0, MAX_CRASHES);
  } catch {
    return []; // damaged or unavailable: an empty log, never a second crash
  }
}

export function clearCrashes(): void {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

// Builds the description of a crash without keeping it anywhere (safe to call while a screen is drawing)
export function describeCrash(
  value: unknown,
  where: Crash["where"],
  now: number = Date.now(),
): Crash {
  const e = toError(value);
  return {
    at: now,
    where,
    name: scrub(e.name || "Error", 60),
    message: scrub(e.message || "", 200),
    stack: scrub(
      (e.stack ?? "")
        .split("\n")
        .slice(0, 8)
        .map((l) => l.trim())
        .join("\n"),
      700,
    ),
    path: safePath(globalThis.location?.pathname ?? "/"),
    build: build(),
    stale: isStaleBundleError(e),
  };
}

// Remembers a crash and returns it. If the phone's storage is full or blocked, the crash is still returned (just not kept).
export function recordCrash(
  value: unknown,
  where: Crash["where"],
  now: number = Date.now(),
): Crash {
  const crash = describeCrash(value, where, now);
  try {
    const list = readCrashes();
    const last = list[0];
    if (
      last &&
      last.name === crash.name &&
      last.message === crash.message &&
      last.path === crash.path &&
      last.where === crash.where &&
      now - last.at < QUIET_MS
    )
      return last;
    globalThis.localStorage?.setItem(
      KEY,
      JSON.stringify([crash, ...list].slice(0, MAX_CRASHES)),
    );
  } catch {
    /* storage full or blocked */
  }
  return crash;
}

// The text a person copies and sends to support
export function crashReport(c: Crash, userAgent = ""): string {
  return [
    "Prima crash report",
    `When: ${new Date(c.at).toISOString()}`,
    `Where: ${c.where}${c.stale ? " (the app was updated while open)" : ""}`,
    `Screen: ${c.path}`,
    `Version: ${c.build}`,
    userAgent ? `Browser: ${scrub(userAgent, 140)}` : "",
    `Error: ${c.name}: ${c.message}`,
    c.stack ? `\n${c.stack}` : "",
    "\nThis report holds no patient information.",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

// Listens for what no screen caught: scripts that threw and promises nobody handled.
// At most five are kept a minute, so a crash that repeats in a loop cannot fill the phone.
export function installGlobalCapture(
  win: Pick<Window, "addEventListener" | "removeEventListener"> = window,
): () => void {
  let recent: number[] = [];
  const allow = () => {
    const now = Date.now();
    recent = recent.filter((t) => now - t < 60_000);
    if (recent.length >= 5) return false;
    recent.push(now);
    return true;
  };
  const onError = (ev: Event) => {
    const e = ev as ErrorEvent;
    const err = e.error ?? new Error(e.message || "Script error");
    if (!isNoise(err) && allow()) recordCrash(err, "script");
  };
  const onRejection = (ev: Event) => {
    const err = toError((ev as PromiseRejectionEvent).reason);
    if (!isNoise(err) && allow()) recordCrash(err, "promise");
  };
  win.addEventListener("error", onError);
  win.addEventListener("unhandledrejection", onRejection);
  return () => {
    win.removeEventListener("error", onError);
    win.removeEventListener("unhandledrejection", onRejection);
  };
}
