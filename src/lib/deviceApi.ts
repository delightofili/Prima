import { supabase } from "./supabase";
import { classify, messageOf } from "./syncErrors";
import { rowToDevice, type DeviceRow } from "./deviceHealth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const ms = (s: unknown): number | null =>
  typeof s === "string" && s ? Date.parse(s) : null;

export interface DeviceList {
  rows: DeviceRow[];
  facilityPulse: number | null;
  serverNow: number; // the server's clock, so ages never depend on the clock of the phone looking at them
}

// Why the list could not be loaded, in terms a screen can explain
export type DeviceProblem =
  | "offline"
  | "setup"
  | "signin"
  | "forbidden"
  | "failed";

export class DeviceListError extends Error {
  problem: DeviceProblem;
  constructor(problem: DeviceProblem, message: string) {
    super(message);
    this.problem = problem;
    this.name = "DeviceListError";
  }
}

function explain(e: unknown): DeviceListError {
  const raw = messageOf(e);
  if (/facility admin/i.test(raw)) return new DeviceListError("forbidden", raw);
  const kind = classify(e);
  if (kind === "network") return new DeviceListError("offline", raw);
  if (kind === "schema") return new DeviceListError("setup", raw); // the Day 23 SQL has not been run yet
  if (kind === "auth") return new DeviceListError("signin", raw);
  return new DeviceListError("failed", raw);
}

export async function listDevices(): Promise<DeviceList> {
  try {
    const { data, error } = await supabase.rpc("list_devices");
    if (error) throw error;
    const raw = (data ?? []) as Row[];
    const first = raw[0];
    return {
      rows: raw.map(rowToDevice),
      facilityPulse: first ? ms(first.facility_pulse) : null,
      serverNow: first ? (ms(first.server_now) ?? Date.now()) : Date.now(),
    };
  } catch (e) {
    throw explain(e);
  }
}

export async function renameDevice(id: string, label: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("rename_device", {
      p_id: id,
      p_label: label,
    });
    if (error) throw error;
  } catch (e) {
    throw explain(e);
  }
}

export async function removeDevice(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("remove_device", { p_id: id });
    if (error) throw error;
  } catch (e) {
    throw explain(e);
  }
}
