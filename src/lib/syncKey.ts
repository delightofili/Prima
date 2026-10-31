// The clinic key: a secret every signed-in phone of a facility holds. Two phones prove to each other that they
// have it before they swap records. It is fetched from the cloud while online and kept on the phone, so syncing
// between phones works with no internet at all.
import { db } from "../db";
import { isPowerSaving } from "./power";
import { supabase } from "./supabase";
import { classify } from "./syncErrors";

const K = {
  key: "peerKey",
  version: "peerKeyV",
  facility: "peerKeyFac",
  at: "peerKeyAt",
} as const;
const REFRESH_EVERY = 6 * 3_600_000; // look for a new key at least this often while online

export interface ClinicKey {
  key: string;
  version: number;
}

// The key this phone holds for this facility, or null if it has none (never fetched, or it belongs to another facility)
export async function readClinicKey(
  facilityId: string,
): Promise<ClinicKey | null> {
  const [key, version, facility] = await Promise.all([
    db.meta.get(K.key),
    db.meta.get(K.version),
    db.meta.get(K.facility),
  ]);
  const v = Number(version?.value);
  if (
    !key?.value ||
    facility?.value !== facilityId ||
    !Number.isInteger(v) ||
    v < 1
  )
    return null;
  return { key: key.value, version: v };
}

export type KeyResult =
  | "updated"
  | "same"
  | "offline"
  | "setup"
  | "signin"
  | "failed";

export async function fetchClinicKey(facilityId: string): Promise<KeyResult> {
  try {
    const { data, error } = await supabase.rpc("get_sync_key");
    if (error) throw error;
    const k = data as { key?: unknown; version?: unknown } | null;
    if (
      typeof k?.key !== "string" ||
      k.key.length < 40 ||
      k.key.length > 64 ||
      !Number.isInteger(k.version) ||
      (k.version as number) < 1
    )
      return "failed";
    const had = await readClinicKey(facilityId);
    await db.meta.bulkPut([
      { key: K.key, value: k.key },
      { key: K.version, value: String(k.version) },
      { key: K.facility, value: facilityId },
      { key: K.at, value: String(Date.now()) },
    ]);
    return had && had.key === k.key && had.version === k.version
      ? "same"
      : "updated";
  } catch (e) {
    const kind = classify(e);
    return kind === "network"
      ? "offline"
      : kind === "schema"
        ? "setup"
        : kind === "auth"
          ? "signin"
          : "failed";
  }
}

let started = false;

// Keeps the key fresh in the background, so it is already there the day the internet goes down.
// A change of key (someone was removed from the team) reaches a phone the next time it is online.
export function startClinicKeyRefresh(getFacilityId: () => string | null) {
  if (started) return;
  started = true;
  const attempt = async () => {
    const facilityId = getFacilityId();
    if (
      !facilityId ||
      !navigator.onLine ||
      document.visibilityState !== "visible" ||
      isPowerSaving()
    )
      return;
    try {
      if (!(await supabase.auth.getSession()).data.session) return;
      const last = Number((await db.meta.get(K.at))?.value ?? 0);
      const held = await readClinicKey(facilityId);
      if (held && Date.now() - last < REFRESH_EVERY) return;
      await fetchClinicKey(facilityId);
    } catch {
      /* a nice-to-have in the background: never trouble the nurse */
    }
  };
  window.addEventListener("online", () =>
    window.setTimeout(() => void attempt(), 3000 + Math.random() * 5000),
  );
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void attempt();
  });
  window.setTimeout(() => void attempt(), 12_000 + Math.random() * 20_000); // phones must not all call at the same second
  window.setInterval(() => void attempt(), 30 * 60_000);
}
