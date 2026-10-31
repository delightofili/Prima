// What a phone is willing to accept from another phone, and which copy of a record wins.
// Another phone is never trusted blindly: it may be buggy, out of date, or not what it claims to be.

export type TableName =
  | "guardians"
  | "patients"
  | "visits"
  | "immunizations"
  | "reminders";
export const TABLES: readonly TableName[] = [
  "guardians",
  "patients",
  "visits",
  "immunizations",
  "reminders",
];

// id, last changed (device clock), erased (0 or 1)
export type Entry = [id: string, updatedAt: number, erased: 0 | 1];

export interface Rec {
  id: string;
  facilityId: string;
  updatedAt: number;
  erasedAt?: number;
  [key: string]: unknown;
}

export const MIN_TIME = Date.UTC(2020, 0, 1);
export const MAX_AHEAD = 24 * 3_600_000; // a record "from tomorrow" would beat every honest edit for a day

const ID = /^[A-Za-z0-9:_.-]{1,200}$/;
const KEY = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
const NEEDS_PATIENT: readonly TableName[] = [
  "visits",
  "immunizations",
  "reminders",
];

const goodTime = (v: unknown, now: number): v is number =>
  typeof v === "number" &&
  Number.isFinite(v) &&
  v >= MIN_TIME &&
  v <= now + MAX_AHEAD;

// Returns a clean copy of the record, or null if anything about it is wrong
export function validateRecord(
  table: TableName,
  raw: unknown,
  ctx: { facilityId: string; now: number },
): Rec | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    return null;
  const keys = Object.keys(raw);
  if (keys.length > 60) return null;

  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (!KEY.test(k) || FORBIDDEN.has(k)) return null;
    const v = (raw as Record<string, unknown>)[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      if (v.length > 4000) return null;
      out[k] = v;
    } else if (typeof v === "number") {
      if (!Number.isFinite(v) || Math.abs(v) > 1e15) return null;
      out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v;
    } else {
      return null; // Prima's records are flat: a nested object or a list does not belong
    }
  }

  if (typeof out.id !== "string" || !ID.test(out.id)) return null;
  if (out.facilityId !== ctx.facilityId) return null; // never mix in another clinic's records
  if (!goodTime(out.updatedAt, ctx.now) || !goodTime(out.createdAt, ctx.now))
    return null;
  if (out.erasedAt !== undefined && !goodTime(out.erasedAt, ctx.now))
    return null;
  if (out.deletedAt !== undefined && !goodTime(out.deletedAt, ctx.now))
    return null;
  if (
    NEEDS_PATIENT.includes(table) &&
    (typeof out.patientId !== "string" || !ID.test(out.patientId))
  )
    return null;
  return out as Rec;
}

export type Decision = "add" | "update" | "skip";

// Which copy wins: the same rule the cloud download uses.
// An erased record is never brought back, and an erasure always wins. Otherwise the newer change wins.
export function decide(
  local: { updatedAt: number; erasedAt?: number } | undefined,
  incoming: { updatedAt: number; erasedAt?: number },
): Decision {
  if (!local) return "add";
  if (local.erasedAt) return "skip";
  if (incoming.erasedAt) return "update";
  return incoming.updatedAt > local.updatedAt ? "update" : "skip";
}

// The same rule seen from the sending side, using only what the index holds, so both phones agree
export function shouldSend(
  mine: Entry,
  theirs: [number, 0 | 1] | undefined,
): boolean {
  if (!theirs) return true;
  if (mine[2] === 1) return theirs[1] === 0; // I am erased: send unless they already are
  if (theirs[1] === 1) return false; // they are erased, I am not: nothing of mine may undo that
  return mine[1] > theirs[0]; // both live: only a newer change is worth sending
}
