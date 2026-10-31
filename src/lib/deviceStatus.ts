// The phone's side of the device dashboard: it gives itself an id, and now and then tells the cloud how its sync is going.
// A report holds counts, times, the app version and a device name. It never holds patient information.
import { db } from "../db";
import {
  changeKey,
  deviceLabelFromAgent,
  reportToArgs,
  type DeviceReport,
} from "./deviceHealth";
import { isPowerSaving } from "./power";
import { supabase } from "./supabase";
import { getSyncHealth } from "./syncHealth";

const ID_KEY = "deviceId";
const PULSE_KEY = "pulse"; // the same key the sync engine saves its "newest change I have downloaded" under

let idPromise: Promise<string> | null = null;

// A random id, made once on this phone and kept with its other settings. Erasing the phone makes a new one.
export function getDeviceId(): Promise<string> {
  idPromise ??= (async () => {
    const row = await db.meta.get(ID_KEY);
    if (row?.value) return row.value;
    const id = crypto.randomUUID();
    await db.meta.put({ key: ID_KEY, value: id });
    return id;
  })();
  return idPromise;
}

async function readBattery(): Promise<{
  level: number | null;
  charging: boolean | null;
}> {
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<{ level: number; charging: boolean }>;
  };
  if (!nav.getBattery) return { level: null, charging: null }; // only Chrome on Android can say
  try {
    const b = await nav.getBattery();
    return { level: Math.round(b.level * 100), charging: b.charging };
  } catch {
    return { level: null, charging: null };
  }
}

export async function collectReport(): Promise<DeviceReport> {
  const id = await getDeviceId();
  const queue = await db.syncQueue.toArray();
  const waiting = queue.filter((i) => i.status !== "failed");
  const battery = await readBattery();
  return {
    id,
    name: deviceLabelFromAgent(navigator.userAgent, id),
    appVersion: typeof __BUILD__ === "string" ? __BUILD__ : "unknown",
    waiting: waiting.length,
    failed: queue.length - waiting.length,
    oldestWaitingAt:
      waiting.length > 0 ? Math.min(...waiting.map((i) => i.createdAt)) : null,
    lastSyncAt: getSyncHealth().lastOkAt,
    pulseSeen: (await db.meta.get(PULSE_KEY))?.value ?? null,
    battery: battery.level,
    charging: battery.charging,
    powerSaving: isPowerSaving(),
    deviceTime: Date.now(),
  };
}

/* ---------- when to report ---------- */

const CHECK_EVERY = 60_000; // look for a change once a minute (this is only a local check, nothing is sent)
const MIN_GAP = 30_000; // never report more often than this
const IDLE_EVERY = 15 * 60_000; // when nothing changes, report this often so the admin knows the phone is alive

let lastKey = "";
let lastAt = 0;
let unavailable = false; // the cloud has no such function yet: stop asking until the app is reopened

async function hasSession() {
  try {
    return !!(await supabase.auth.getSession()).data.session;
  } catch {
    return false;
  }
}

let sending = false; // two triggers at the same moment (screen back on, internet back) must send one report, not two

export async function reportNow(force = false): Promise<boolean> {
  if (
    sending ||
    unavailable ||
    !navigator.onLine ||
    document.visibilityState !== "visible" ||
    isPowerSaving()
  )
    return false;
  sending = true;
  try {
    if (!(await hasSession())) return false;
    const report = await collectReport();
    const key = changeKey(report);
    const due = force || key !== lastKey || Date.now() - lastAt >= IDLE_EVERY;
    if (!due || Date.now() - lastAt < MIN_GAP) return false;
    try {
      const { error } = await supabase.rpc(
        "report_device",
        reportToArgs(report),
      );
      if (error) throw error;
      lastKey = key;
      lastAt = Date.now();
      return true;
    } catch (e) {
      // This is a nice-to-have. It must never trouble the nurse, and never hammer a server that says no.
      if ((e as { code?: string })?.code === "PGRST202") unavailable = true;
      if (import.meta.env.DEV) console.warn("Device report failed", e);
      return false;
    }
  } finally {
    sending = false;
  }
}

let started = false;

export function startDeviceReports() {
  if (started) return;
  started = true;
  const soon = () =>
    window.setTimeout(() => void reportNow(), 2000 + Math.random() * 3000);
  window.addEventListener("online", soon);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") soon();
  });
  window.setTimeout(() => void reportNow(true), 5000 + Math.random() * 20_000); // phones must not all call at the same second
  window.setInterval(() => void reportNow(), CHECK_EVERY);
}
