import { db } from "../db";
import { en, type Key } from "../i18n/locales/en";
import type { FacilityInfo } from "./config";
import { supabase } from "./supabase";

export type Role = "admin" | "staff";

export interface LocalAccount {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface Mine {
  facility: FacilityInfo;
  role: Role;
}

const ACCOUNT_KEY = "account";
const FACILITY_KEY = "facility";
const NOTICE_KEY = "prima_notice";

export const readNotice = () => {
  try {
    return localStorage.getItem(NOTICE_KEY);
  } catch {
    return null;
  }
};
export const clearNotice = () => {
  try {
    localStorage.removeItem(NOTICE_KEY);
  } catch {
    /* storage unavailable */
  }
};

/* ---------- the sign-in record kept on the phone ---------- */

export async function readLocal(): Promise<{
  account: LocalAccount;
  facility: FacilityInfo;
} | null> {
  const [a, f] = await Promise.all([
    db.meta.get(ACCOUNT_KEY),
    db.meta.get(FACILITY_KEY),
  ]);
  if (!a || !f) return null;
  try {
    return {
      account: JSON.parse(a.value) as LocalAccount,
      facility: JSON.parse(f.value) as FacilityInfo,
    };
  } catch {
    return null;
  }
}

export async function writeLocal(
  account: LocalAccount,
  facility: FacilityInfo,
) {
  await db.meta.bulkPut([
    { key: ACCOUNT_KEY, value: JSON.stringify(account) },
    { key: FACILITY_KEY, value: JSON.stringify(facility) },
  ]);
}

const clearLocalAccount = () => db.meta.bulkDelete([ACCOUNT_KEY, FACILITY_KEY]);

/* ---------- talking to the cloud ---------- */

export const rowToFacility = (r: Record<string, unknown>): FacilityInfo => ({
  id: r.id as string,
  name: r.name as string,
  code: r.code as string,
  lga: r.lga as string,
  state: r.state as string,
  plan: (r.plan as FacilityInfo["plan"]) ?? "free",
});

export async function fetchMyFacility(userId: string): Promise<Mine | null> {
  const { data: rows, error } = await supabase
    .from("memberships")
    .select("role, facility_id")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  if (!rows || rows.length === 0) return null;

  const { data: fac, error: facError } = await supabase
    .from("facilities")
    .select("id, name, code, lga, state, plan")
    .eq("id", rows[0].facility_id)
    .single();
  if (facError) throw facError;
  return { role: rows[0].role as Role, facility: rowToFacility(fac) };
}

export type Access =
  | { state: "ok"; mine: Mine }
  | { state: "removed" }
  | { state: "unknown" };

// "Removed" is declared only when the account is real and reachable but has no membership.
// Any doubt (network, expired session, server trouble) is "unknown", which never locks anyone out.
export async function checkAccess(userId: string): Promise<Access> {
  try {
    const mine = await fetchMyFacility(userId);
    if (mine) return { state: "ok", mine };
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .limit(1);
    if (error) return { state: "unknown" };
    return data && data.length > 0
      ? { state: "removed" }
      : { state: "unknown" };
  } catch {
    return { state: "unknown" };
  }
}

export async function rpcCreateFacility(input: {
  name: string;
  code: string;
  lga: string;
  state: string;
}) {
  const { data, error } = await supabase.rpc("create_facility", {
    p_name: input.name,
    p_code: input.code,
    p_lga: input.lga,
    p_state: input.state,
  });
  if (error) throw error;
  return rowToFacility(data as Record<string, unknown>);
}

export async function rpcJoinFacility(code: string) {
  const { error } = await supabase.rpc("join_facility", { p_code: code });
  if (error) throw error;
}

/* ---------- shared phones ---------- */

// Does this phone hold records that belong to a different facility?
export async function foreignData(facilityId: string) {
  const sample = await db.patients.limit(1).first();
  const foreign = !!sample && sample.facilityId !== facilityId;
  return { foreign, unsynced: foreign ? await db.syncQueue.count() : 0 };
}

function clearCloudSessionStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") && k.includes("-auth-token"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}

// Signing out must work with no internet, so the session is also removed by hand.
export async function signOutThisPhone() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* offline */
  }
  clearCloudSessionStorage();
  await clearLocalAccount();
  window.location.reload();
}

export async function eraseThisPhone() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* offline */
  }
  clearCloudSessionStorage();
  await db.delete();
  window.location.reload();
}

export async function eraseLocalDataOnly() {
  await db.delete();
  window.location.reload();
}

/* ---------- friendly wording ---------- */

// The message for a screen: a dictionary key when Prima has its own words for the problem (the screen turns it
// into the person's language with tv), otherwise the server's own message as it came.
export function friendlyErrorKey(e: unknown): string {
  const msg = (e as { message?: string })?.message;
  if (!msg) return "authErr.generic" satisfies Key;
  if (/invalid login credentials/i.test(msg))
    return "authErr.wrongLogin" satisfies Key;
  if (/already registered|already exists/i.test(msg))
    return "authErr.exists" satisfies Key;
  if (/failed to fetch|network|load failed/i.test(msg))
    return "authErr.network" satisfies Key;
  if (/rate limit|too many/i.test(msg)) return "authErr.rate" satisfies Key;
  return msg;
}

// The same thing as an English sentence, for code that has not been converted
export function friendlyError(e: unknown): string {
  const k = friendlyErrorKey(e);
  return k in en ? en[k as Key] : k;
}

const SKIP = new Set([
  "phc",
  "primary",
  "health",
  "centre",
  "center",
  "clinic",
  "hospital",
  "the",
  "of",
  "and",
]);

export function suggestCode(facilityName: string): string {
  const words = facilityName
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .split(" ")
    .filter((w) => w && !SKIP.has(w.toLowerCase()));
  const initials = words.map((w) => w[0]).join("");
  const code = initials.length >= 2 ? initials : (words[0] ?? "").slice(0, 3);
  return code.slice(0, 5);
}
