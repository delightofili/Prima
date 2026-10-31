import {
  BEHIND_CAP,
  DAY,
  HOUR,
  MINUTE,
  LIMITS,
  buildTime,
  changeKey,
  classifyDevice,
  deviceLabelFromAgent,
  newestBuildOf,
  reportToArgs,
  rowToDevice,
  sortByNeed,
  spanMsg,
  summarize,
  type Context,
  type DeviceReport,
  type DeviceRow,
} from "../src/lib/deviceHealth";

let failed = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
  if (!cond) failed++;
};

const NOW = Date.UTC(2026, 9, 30, 12, 0, 0);
const BUILD = "2026-10-30 10:00 UTC";
const row = (over: Partial<DeviceRow> = {}): DeviceRow => ({
  id: "d1",
  label: null,
  deviceName: "Android · Chrome 129 · 7F3A",
  appVersion: BUILD,
  userName: "Ngozi",
  waiting: 0,
  failed: 0,
  oldestWaitingAt: null,
  lastSyncAt: NOW - 2 * MINUTE,
  pulseSeen: NOW - MINUTE,
  battery: 80,
  charging: false,
  powerSaving: false,
  deviceTime: NOW,
  firstSeenAt: NOW - 30 * DAY,
  seenAt: NOW,
  recordsBehind: 0,
  ...over,
});
const ctx = (over: Partial<Context> = {}): Context => ({
  now: NOW,
  facilityPulse: NOW - MINUTE,
  newestBuild: BUILD,
  ...over,
});
const flagIds = (r: DeviceRow, c = ctx()) =>
  classifyDevice(r, c).flags.map((f) => f.id);

/* ---- a name for a device nobody has named ---- */
ok(
  "name: Android with Chrome",
  deviceLabelFromAgent(
    "Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    "11111111-2222-3333-4444-5555555a7f3a",
  ) === "Android · Chrome 129 · 7F3A",
);
ok(
  "name: iPhone with Safari",
  deviceLabelFromAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    "aaaa-bbbb",
  ) === "iPhone · Safari 17 · BBBB",
);
ok(
  "name: Samsung Internet is not mistaken for Chrome",
  deviceLabelFromAgent(
    "Mozilla/5.0 (Linux; Android 12; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36",
    "0000-1234",
  ).startsWith("Android · Samsung Internet 24"),
);
ok(
  "name: Edge is not mistaken for Chrome",
  deviceLabelFromAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    "1-2",
  ).startsWith("Windows · Edge 129"),
);
ok(
  "name: Firefox on Android",
  deviceLabelFromAgent(
    "Mozilla/5.0 (Android 13; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0",
    "ffff",
  ).startsWith("Android · Firefox 130"),
);
ok(
  "name: something unknown still gets a usable name",
  deviceLabelFromAgent("", "abcd-ef01") === "Device · Browser · EF01",
);

/* ---- the healthy case ---- */
ok(
  "a device that is fine has no flags and level ok",
  classifyDevice(row(), ctx()).level === "ok" && flagIds(row()).length === 0,
);

/* ---- records that need attention ---- */
ok(
  "failed records make it bad",
  classifyDevice(row({ failed: 2 }), ctx()).level === "bad" &&
    flagIds(row({ failed: 2 }))[0] === "failed",
);

/* ---- not seen for a long time ---- */
ok(
  "not seen for 2 days: no flag",
  !flagIds(row({ seenAt: NOW - 2 * DAY })).includes("unseen"),
);
ok(
  "not seen for 4 days with nothing waiting: warn",
  classifyDevice(
    row({ seenAt: NOW - 4 * DAY, deviceTime: NOW - 4 * DAY }),
    ctx(),
  ).flags.find((f) => f.id === "unseen")?.severity === "warn",
);
ok(
  "not seen for 4 days with records on it: bad",
  classifyDevice(
    row({
      seenAt: NOW - 4 * DAY,
      deviceTime: NOW - 4 * DAY,
      waiting: 5,
      oldestWaitingAt: NOW - 4 * DAY - HOUR,
    }),
    ctx(),
  ).flags.find((f) => f.id === "unseen")?.severity === "bad",
);

/* ---- waiting for a long time, measured on the device's own clock ---- */
ok(
  "waiting 1 hour: nothing yet",
  !flagIds(row({ waiting: 3, oldestWaitingAt: NOW - HOUR })).includes("stuck"),
);
ok(
  "waiting 3 hours: warn, with the count and the age",
  (() => {
    const f = classifyDevice(
      row({ waiting: 3, oldestWaitingAt: NOW - 3 * HOUR }),
      ctx(),
    ).flags.find((x) => x.id === "stuck");
    return f?.severity === "warn" && f.count === 3 && f.ms === 3 * HOUR;
  })(),
);
ok(
  "waiting 30 hours: bad",
  classifyDevice(
    row({ waiting: 1, oldestWaitingAt: NOW - 30 * HOUR }),
    ctx(),
  ).flags.find((f) => f.id === "stuck")?.severity === "bad",
);
const wrongClock = 5 * 365 * DAY; // a phone whose clock is five years wrong
ok(
  "a wrong clock cannot fake or hide a long wait (both ends are on the device's clock)",
  (() => {
    const r = row({
      waiting: 2,
      oldestWaitingAt: NOW - wrongClock - 3 * HOUR,
      deviceTime: NOW - wrongClock,
    });
    return (
      classifyDevice(r, ctx()).flags.find((f) => f.id === "stuck")?.ms ===
      3 * HOUR
    );
  })(),
);

/* ---- the clock itself ---- */
ok(
  "clock 2 minutes off: fine",
  !flagIds(row({ deviceTime: NOW - 2 * MINUTE })).includes("clock"),
);
ok(
  "clock 10 minutes off: warn",
  classifyDevice(row({ deviceTime: NOW - 10 * MINUTE }), ctx()).flags.find(
    (f) => f.id === "clock",
  )?.severity === "warn",
);
ok(
  "clock 3 hours ahead: bad, and the size of the error is kept",
  (() => {
    const f = classifyDevice(
      row({ deviceTime: NOW + 3 * HOUR }),
      ctx(),
    ).flags.find((x) => x.id === "clock");
    return f?.severity === "bad" && f.ms === 3 * HOUR;
  })(),
);
ok(
  "no device time reported: no clock flag",
  !flagIds(row({ deviceTime: null })).includes("clock"),
);

/* ---- behind: newer records it has not downloaded ---- */
const stale = NOW - 2 * HOUR;
ok(
  "4 newer records and 2 hours stale: behind, with the count",
  (() => {
    const f = classifyDevice(
      row({ pulseSeen: stale, recordsBehind: 4 }),
      ctx(),
    ).flags.find((x) => x.id === "behind");
    return f?.severity === "warn" && f.count === 4 && !f.many;
  })(),
);
ok(
  "stale but nothing newer to download: not behind",
  !flagIds(row({ pulseSeen: stale, recordsBehind: 0 })).includes("behind"),
);
ok(
  "a few minutes stale: not behind yet (it pulls every few minutes)",
  !flagIds(
    row({ pulseSeen: NOW - 5 * MINUTE, recordsBehind: 2 }),
    ctx({ facilityPulse: NOW }),
  ).includes("behind"),
);
ok(
  "500 or more is shown as many",
  classifyDevice(
    row({ pulseSeen: stale, recordsBehind: BEHIND_CAP }),
    ctx(),
  ).flags.find((f) => f.id === "behind")?.many === true,
);
ok(
  "never downloaded anything while the facility has records",
  flagIds(
    row({ pulseSeen: null, lastSyncAt: null, recordsBehind: 40 }),
  ).includes("never"),
);
ok(
  "never downloaded, and the facility is empty: nothing to say",
  !flagIds(row({ pulseSeen: null, recordsBehind: 0 })).includes("never"),
);
ok(
  "the facility has no change at all: nobody is behind",
  !flagIds(
    row({ pulseSeen: stale, recordsBehind: 3 }),
    ctx({ facilityPulse: null }),
  ).includes("behind"),
);

/* ---- app version ---- */
ok(
  "build stamps are read",
  buildTime("2026-10-29 17:20 UTC") === Date.UTC(2026, 9, 29, 17, 20) &&
    buildTime("unknown") === null &&
    buildTime("") === null,
);
ok(
  "the newest build among devices",
  newestBuildOf([
    row({ appVersion: "2026-10-01 08:00 UTC" }),
    row({ appVersion: "2026-10-30 10:00 UTC" }),
    row({ appVersion: "unknown" }),
  ]) === "2026-10-30 10:00 UTC",
);
ok(
  "no readable build: no newest",
  newestBuildOf([row({ appVersion: "unknown" })]) === null,
);
ok(
  "2 days older than the newest: warn",
  classifyDevice(row({ appVersion: "2026-10-28 10:00 UTC" }), ctx()).flags.find(
    (f) => f.id === "oldApp",
  )?.severity === "warn",
);
ok(
  "3 hours older: not worth a warning",
  !flagIds(row({ appVersion: "2026-10-30 07:00 UTC" })).includes("oldApp"),
);
ok(
  "an unknown build is never called old",
  !flagIds(row({ appVersion: "unknown" })).includes("oldApp"),
);

/* ---- battery and Low Battery Mode: a hint, never a warning ---- */
ok(
  "battery 12 percent, not charging: an info flag, level still ok",
  (() => {
    const v = classifyDevice(row({ battery: 12, charging: false }), ctx());
    return (
      v.level === "ok" &&
      v.flags[0]?.id === "lowBattery" &&
      v.flags[0].severity === "info" &&
      v.flags[0].percent === 12
    );
  })(),
);
ok(
  "battery 12 percent but charging: nothing",
  !flagIds(row({ battery: 12, charging: true })).includes("lowBattery"),
);
ok(
  "phone cannot report its battery: nothing",
  !flagIds(row({ battery: null, charging: null })).includes("lowBattery"),
);
ok(
  "Low Battery Mode on: an info flag, level still ok",
  (() => {
    const v = classifyDevice(row({ powerSaving: true }), ctx());
    return v.level === "ok" && v.flags[0]?.id === "powerSaving";
  })(),
);

/* ---- several problems at once ---- */
ok(
  "flags come worst first",
  (() => {
    const ids = flagIds(
      row({
        failed: 1,
        waiting: 2,
        oldestWaitingAt: NOW - 3 * HOUR,
        pulseSeen: stale,
        recordsBehind: 9,
        battery: 5,
        deviceTime: NOW - 10 * MINUTE,
      }),
    );
    return (
      ids[0] === "failed" &&
      ids.indexOf("stuck") < ids.indexOf("behind") &&
      ids.indexOf("behind") < ids.indexOf("lowBattery")
    );
  })(),
);

/* ---- the summary and the order on screen ---- */
const items = [
  {
    row: row({ id: "a", seenAt: NOW - 5 * MINUTE }),
    verdict: classifyDevice(row(), ctx()),
  },
  {
    row: row({ id: "b", seenAt: NOW - HOUR, failed: 2, waiting: 1 }),
    verdict: classifyDevice(row({ failed: 2, waiting: 1 }), ctx()),
  },
  {
    row: row({
      id: "c",
      seenAt: NOW - 2 * MINUTE,
      waiting: 4,
      oldestWaitingAt: NOW - 3 * HOUR,
    }),
    verdict: classifyDevice(
      row({ waiting: 4, oldestWaitingAt: NOW - 3 * HOUR }),
      ctx(),
    ),
  },
  {
    row: row({ id: "d", seenAt: NOW - MINUTE }),
    verdict: classifyDevice(row(), ctx()),
  },
];
const s = summarize(items);
ok(
  "summary counts each level",
  s.total === 4 && s.ok === 2 && s.warn === 1 && s.bad === 1,
  JSON.stringify(s),
);
ok(
  "summary adds up the records waiting or failed on every device",
  s.waiting === 2 + 1 + 4,
  `got ${s.waiting}`,
);
ok(
  "order: bad first, then warn, then the rest with the most recent first",
  sortByNeed(items)
    .map((i) => i.row.id)
    .join("") === "bcda",
);
ok(
  "an empty list summarises to zeros",
  JSON.stringify(summarize([])) ===
    JSON.stringify({ total: 0, ok: 0, warn: 0, bad: 0, waiting: 0 }),
);

/* ---- lengths of time ---- */
const sp = (ms: number) => JSON.stringify(spanMsg(ms));
ok(
  "20 seconds is called 1 minute, never 0",
  sp(20_000) === JSON.stringify({ plural: "dev.span.minutes", count: 1 }),
);
ok(
  "5 minutes",
  sp(5 * MINUTE) === JSON.stringify({ plural: "dev.span.minutes", count: 5 }),
);
ok(
  "59.6 minutes becomes 1 hour, not '60 minutes'",
  sp(59.6 * MINUTE) === JSON.stringify({ plural: "dev.span.hours", count: 1 }),
);
ok(
  "47 hours stays in hours",
  sp(47 * HOUR) === JSON.stringify({ plural: "dev.span.hours", count: 47 }),
);
ok(
  "49 hours is 2 days",
  sp(49 * HOUR) === JSON.stringify({ plural: "dev.span.days", count: 2 }),
);

/* ---- the report a phone sends ---- */
const report: DeviceReport = {
  id: "dev-1",
  name: "Android · Chrome 129 · 7F3A",
  appVersion: BUILD,
  waiting: 3,
  failed: 1,
  oldestWaitingAt: NOW - HOUR,
  lastSyncAt: NOW - MINUTE,
  pulseSeen: "2026-10-02T00:00:01+00:00",
  battery: 41,
  charging: false,
  powerSaving: false,
  deviceTime: NOW,
};
const args = reportToArgs(report);
ok(
  "the report uses the cloud function's argument names",
  Object.keys(args).sort().join() ===
    [
      "p_app_version",
      "p_battery",
      "p_charging",
      "p_device",
      "p_device_time",
      "p_failed",
      "p_last_sync",
      "p_name",
      "p_oldest_waiting",
      "p_power_saving",
      "p_pulse_seen",
      "p_waiting",
    ].join(),
);
ok(
  "times are sent as ISO text",
  args.p_device_time === new Date(NOW).toISOString() &&
    args.p_pulse_seen === "2026-10-02T00:00:01.000Z",
);
ok(
  "a missing time is sent as null",
  reportToArgs({
    ...report,
    oldestWaitingAt: null,
    lastSyncAt: null,
    pulseSeen: null,
  }).p_oldest_waiting === null &&
    reportToArgs({ ...report, pulseSeen: null }).p_pulse_seen === null,
);
ok(
  "rubbish in the saved download time cannot break a report",
  reportToArgs({ ...report, pulseSeen: "not a date" }).p_pulse_seen === null,
);
ok(
  "every value in the report is a plain number, text, true/false or empty (nothing nested that could carry a record)",
  Object.values(args).every(
    (v) => v === null || ["string", "number", "boolean"].includes(typeof v),
  ),
);
ok(
  "the battery changing alone is not a reason to report again",
  changeKey(report) ===
    changeKey({
      ...report,
      battery: 40,
      charging: true,
      deviceTime: NOW + MINUTE,
    }),
);
ok(
  "a new waiting record, a sync or a download is",
  changeKey(report) !== changeKey({ ...report, waiting: 4 }) &&
    changeKey(report) !== changeKey({ ...report, lastSyncAt: NOW }) &&
    changeKey(report) !== changeKey({ ...report, pulseSeen: "x" }),
);

/* ---- a row from the database ---- */
const d = rowToDevice({
  id: "x",
  label: "Front desk",
  device_name: "Android · Chrome 129 · 7F3A",
  app_version: BUILD,
  user_name: "Ngozi",
  waiting: 2,
  failed: 0,
  oldest_waiting_at: "2026-10-30T09:00:00Z",
  last_sync_at: null,
  pulse_seen: "2026-10-30T11:00:00Z",
  battery: 0,
  charging: null,
  power_saving: true,
  device_time: "2026-10-30T12:00:00Z",
  first_seen_at: "2026-10-01T00:00:00Z",
  seen_at: "2026-10-30T12:00:01Z",
  records_behind: 7,
});
ok(
  "a database row becomes a device",
  d.label === "Front desk" &&
    d.waiting === 2 &&
    d.lastSyncAt === null &&
    d.pulseSeen === Date.UTC(2026, 9, 30, 11) &&
    d.powerSaving === true &&
    d.recordsBehind === 7,
);
ok(
  "a battery of 0 is kept, a missing charging flag stays missing",
  d.battery === 0 && d.charging === null,
);
ok(
  "a bare row does not crash",
  rowToDevice({ id: "y" }).deviceName === "" &&
    rowToDevice({ id: "y" }).seenAt === 0,
);
ok(
  "the limits are the numbers the screen explains",
  LIMITS.unseen === 3 * DAY &&
    LIMITS.stuckWarn === 2 * HOUR &&
    LIMITS.clockWarn === 5 * MINUTE,
);

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
