// What a facility admin needs to know about each phone or tablet, decided in one place with no screen involved,
// so the rules can be tested and never disagree between the card, the summary and the sort order.
import type { Msg } from "../i18n";

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

// When does a device deserve a warning? Change a number here and every screen follows.
export const LIMITS = {
  unseen: 3 * DAY, // not heard from for this long
  stuckWarn: 2 * HOUR, // records have been waiting to upload this long
  stuckBad: 24 * HOUR,
  behindLag: 10 * MINUTE, // the facility has changes this much newer than the device has downloaded
  clockWarn: 5 * MINUTE, // the device clock differs from the server clock by this much
  clockBad: HOUR,
  oldApp: DAY, // the device runs a build this much older than the newest one in the facility
  lowBattery: 15, // percent
} as const;

// The server counts the records a device is missing, but only up to this many
export const BEHIND_CAP = 500;

// One device, as the admin's list gives it. Times are milliseconds, or null when the device never reported one.
export interface DeviceRow {
  id: string;
  label: string | null; // a name an admin chose
  deviceName: string; // the name the device gave itself
  appVersion: string;
  userName: string | null;
  waiting: number;
  failed: number;
  oldestWaitingAt: number | null; // device clock
  lastSyncAt: number | null; // device clock
  pulseSeen: number | null; // newest facility change the device has downloaded
  battery: number | null;
  charging: boolean | null;
  powerSaving: boolean;
  deviceTime: number | null; // device clock when it reported
  firstSeenAt: number;
  seenAt: number; // SERVER clock when it reported
  recordsBehind: number; // 0 to BEHIND_CAP
}

export interface Context {
  now: number; // the server's clock when the list was fetched
  facilityPulse: number | null; // the facility's newest change
  newestBuild: string | null; // the newest app build running on any device here
}

export type FlagId =
  | "failed"
  | "unseen"
  | "stuck"
  | "behind"
  | "never"
  | "clock"
  | "oldApp"
  | "lowBattery"
  | "powerSaving";
export type Severity = "info" | "warn" | "bad";

export interface Flag {
  id: FlagId;
  severity: Severity;
  count?: number;
  ms?: number;
  percent?: number;
  many?: boolean;
}

export type Level = "ok" | "warn" | "bad";
export interface Verdict {
  level: Level;
  flags: Flag[]; // worst first
}

const RANK: Record<Severity, number> = { bad: 0, warn: 1, info: 2 };
const ORDER: FlagId[] = [
  "failed",
  "unseen",
  "stuck",
  "clock",
  "behind",
  "never",
  "oldApp",
  "lowBattery",
  "powerSaving",
];

// "2026-10-29 17:20 UTC" -> milliseconds, or null if it is not a build stamp
export function buildTime(build: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(build);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

export function newestBuildOf(
  rows: Pick<DeviceRow, "appVersion">[],
): string | null {
  let best: string | null = null;
  let bestAt = -1;
  for (const r of rows) {
    const at = buildTime(r.appVersion);
    if (at !== null && at > bestAt) {
      best = r.appVersion;
      bestAt = at;
    }
  }
  return best;
}

export function classifyDevice(row: DeviceRow, ctx: Context): Verdict {
  const flags: Flag[] = [];
  const saved = row.waiting + row.failed;

  if (row.failed > 0)
    flags.push({ id: "failed", severity: "bad", count: row.failed });

  const idle = ctx.now - row.seenAt;
  if (idle > LIMITS.unseen)
    flags.push({
      id: "unseen",
      severity: saved > 0 ? "bad" : "warn",
      ms: idle,
    });

  // Waiting for a long time is measured on the device's own clock at both ends, so a wrong clock cannot fake it
  if (
    row.waiting > 0 &&
    row.oldestWaitingAt !== null &&
    row.deviceTime !== null
  ) {
    const age = row.deviceTime - row.oldestWaitingAt;
    if (age >= LIMITS.stuckWarn)
      flags.push({
        id: "stuck",
        severity: age >= LIMITS.stuckBad ? "bad" : "warn",
        count: row.waiting,
        ms: age,
      });
  }

  // A device clock that is wrong can make a newer edit look older, so edits can lose to older ones
  if (row.deviceTime !== null) {
    const skew = Math.abs(row.deviceTime - row.seenAt);
    if (skew >= LIMITS.clockWarn)
      flags.push({
        id: "clock",
        severity: skew >= LIMITS.clockBad ? "bad" : "warn",
        ms: skew,
      });
  }

  if (row.pulseSeen === null) {
    if (row.recordsBehind > 0) flags.push({ id: "never", severity: "warn" });
  } else if (
    ctx.facilityPulse !== null &&
    ctx.facilityPulse - row.pulseSeen > LIMITS.behindLag &&
    row.recordsBehind > 0
  ) {
    flags.push({
      id: "behind",
      severity: "warn",
      count: row.recordsBehind,
      many: row.recordsBehind >= BEHIND_CAP,
    });
  }

  const mine = buildTime(row.appVersion);
  const newest = ctx.newestBuild ? buildTime(ctx.newestBuild) : null;
  if (mine !== null && newest !== null && newest - mine >= LIMITS.oldApp)
    flags.push({ id: "oldApp", severity: "warn" });

  if (
    row.battery !== null &&
    row.battery <= LIMITS.lowBattery &&
    row.charging !== true
  ) {
    flags.push({ id: "lowBattery", severity: "info", percent: row.battery });
  }
  if (row.powerSaving) flags.push({ id: "powerSaving", severity: "info" });

  flags.sort(
    (a, b) =>
      RANK[a.severity] - RANK[b.severity] ||
      ORDER.indexOf(a.id) - ORDER.indexOf(b.id),
  );
  const level: Level = flags.some((f) => f.severity === "bad")
    ? "bad"
    : flags.some((f) => f.severity === "warn")
      ? "warn"
      : "ok";
  return { level, flags };
}

export interface Summary {
  total: number;
  ok: number;
  warn: number;
  bad: number;
  waiting: number; // records waiting or failed, across every device
}

export function summarize(
  items: { row: DeviceRow; verdict: Verdict }[],
): Summary {
  const s: Summary = {
    total: items.length,
    ok: 0,
    warn: 0,
    bad: 0,
    waiting: 0,
  };
  for (const { row, verdict } of items) {
    s[verdict.level] += 1;
    s.waiting += row.waiting + row.failed;
  }
  return s;
}

const LEVEL_RANK: Record<Level, number> = { bad: 0, warn: 1, ok: 2 };

// The ones that need someone first, then the most recently heard from
export function sortByNeed<T extends { row: DeviceRow; verdict: Verdict }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      LEVEL_RANK[a.verdict.level] - LEVEL_RANK[b.verdict.level] ||
      b.row.seenAt - a.row.seenAt,
  );
}

// A length of time as a message the screen can translate: "5 minutes", "3 hours", "2 days"
export function spanMsg(ms: number): Msg {
  const minutes = Math.max(1, Math.round(ms / MINUTE));
  if (minutes < 60) return { plural: "dev.span.minutes", count: minutes };
  const hours = Math.round(ms / HOUR);
  if (hours < 48) return { plural: "dev.span.hours", count: hours };
  return { plural: "dev.span.days", count: Math.round(ms / DAY) };
}

// A name for a device that nobody has named yet: system, browser, and the last four letters of its id
export function deviceLabelFromAgent(ua: string, id: string): string {
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPad/i.test(ua)
      ? "iPad"
      : /iPhone|iPod/i.test(ua)
        ? "iPhone"
        : /CrOS/i.test(ua)
          ? "Chromebook"
          : /Windows/i.test(ua)
            ? "Windows"
            : /Mac OS X|Macintosh/i.test(ua)
              ? "Mac"
              : /Linux/i.test(ua)
                ? "Linux"
                : "Device";

  const pick = (re: RegExp) => re.exec(ua)?.[1];
  let browser = "Browser";
  let major: string | undefined;
  if ((major = pick(/EdgA?\/(\d+)/))) browser = "Edge";
  else if ((major = pick(/OPR\/(\d+)/))) browser = "Opera";
  else if ((major = pick(/SamsungBrowser\/(\d+)/)))
    browser = "Samsung Internet";
  else if ((major = pick(/(?:Firefox|FxiOS)\/(\d+)/))) browser = "Firefox";
  else if ((major = pick(/(?:CriOS|Chrome)\/(\d+)/))) browser = "Chrome";
  else if ((major = pick(/Version\/(\d+)[\d.]* .*Safari/))) browser = "Safari";

  const code = id.replace(/-/g, "").slice(-4).toUpperCase();
  return `${os} · ${major ? `${browser} ${major}` : browser} · ${code}`;
}

/* ---------- what a phone reports, and how a database row becomes a device ---------- */

export interface DeviceReport {
  id: string;
  name: string;
  appVersion: string;
  waiting: number;
  failed: number;
  oldestWaitingAt: number | null;
  lastSyncAt: number | null;
  pulseSeen: string | null;
  battery: number | null;
  charging: boolean | null;
  powerSaving: boolean;
  deviceTime: number;
}

const iso = (ms: number | null) =>
  ms === null ? null : new Date(ms).toISOString();
const isoText = (s: string | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

// The names the cloud function expects
export const reportToArgs = (r: DeviceReport) => ({
  p_device: r.id,
  p_name: r.name,
  p_app_version: r.appVersion,
  p_waiting: r.waiting,
  p_failed: r.failed,
  p_oldest_waiting: iso(r.oldestWaitingAt),
  p_last_sync: iso(r.lastSyncAt),
  p_pulse_seen: isoText(r.pulseSeen),
  p_battery: r.battery,
  p_charging: r.charging,
  p_power_saving: r.powerSaving,
  p_device_time: iso(r.deviceTime),
});

// What counts as "something changed": the battery moves all the time and is left out on purpose
export const changeKey = (r: DeviceReport) =>
  [
    r.waiting,
    r.failed,
    r.lastSyncAt,
    r.pulseSeen,
    r.appVersion,
    r.powerSaving,
  ].join("|");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const toMs = (s: unknown): number | null =>
  typeof s === "string" && s ? Date.parse(s) : null;

export const rowToDevice = (r: Row): DeviceRow => ({
  id: r.id,
  label: r.label ?? null,
  deviceName: r.device_name ?? "",
  appVersion: r.app_version ?? "",
  userName: r.user_name ?? null,
  waiting: r.waiting ?? 0,
  failed: r.failed ?? 0,
  oldestWaitingAt: toMs(r.oldest_waiting_at),
  lastSyncAt: toMs(r.last_sync_at),
  pulseSeen: toMs(r.pulse_seen),
  battery: typeof r.battery === "number" ? r.battery : null,
  charging: typeof r.charging === "boolean" ? r.charging : null,
  powerSaving: !!r.power_saving,
  deviceTime: toMs(r.device_time),
  firstSeenAt: toMs(r.first_seen_at) ?? 0,
  seenAt: toMs(r.seen_at) ?? 0,
  recordsBehind: r.records_behind ?? 0,
});
