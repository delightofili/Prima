// Sorts a failure into what it really is. The old code treated every error without a database code as "no network",
// so a bug inside Prima looked like a bad connection and the upload retried forever without saying why.
export type ErrorKind =
  | "network" // no connection, a timeout, or the server is unreachable: wait and try again, nothing is wrong with the record
  | "auth" // the sign-in has expired: sign in again
  | "limit" // the Free plan is full (the database refuses the 201st patient)
  | "schema" // the cloud database is missing a column, table or function the app expects: run the latest SQL
  | "permission" // the database refuses this person or this record (row level security)
  | "data" // the database refuses this record: a bad value, a missing parent, a duplicate
  | "bug"; // a mistake inside Prima's own code (TypeError and the like)

interface Loose {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
}

const NETWORK =
  /failed to fetch|networkerror|network request failed|load failed|fetch failed|timed? ?out|timeout|abort|econnreset|econnrefused|enotfound|err_internet|err_network|unavailable|bad gateway|gateway time|paused|<!doctype/i;
const AUTH =
  /\bjwt\b|invalid (jwt|token)|refresh token|not authenticated|session (expired|missing)|auth session missing/i;
const SCHEMA =
  /could not find the .{1,80} (column|table|function)|schema cache|column .{1,80} does not exist|relation .{1,80} does not exist|function .{1,80} does not exist/i;

export function classify(e: unknown): ErrorKind {
  const err = (typeof e === "object" && e !== null ? e : {}) as Loose;
  const message = String(err.message ?? e ?? "");
  const code = typeof err.code === "string" ? err.code : "";
  const name = typeof err.name === "string" ? err.name : "";
  const status = typeof err.status === "number" ? err.status : 0;

  if (code === "PR402") return "limit";
  if (
    code === "PGRST301" ||
    code === "PGRST303" ||
    status === 401 ||
    AUTH.test(message)
  )
    return "auth";
  if (
    ["PGRST202", "PGRST204", "PGRST205", "42703", "42P01", "42883"].includes(
      code,
    ) ||
    SCHEMA.test(message)
  )
    return "schema";
  if (
    name === "TimeoutError" ||
    name === "AbortError" ||
    NETWORK.test(message) ||
    status >= 500
  )
    return "network";
  if (code === "42501" || /row-level security|permission denied/i.test(message))
    return "permission";
  if (code) return "data"; // a real answer from the database that says no to this record
  return "bug";
}

// Problems with one record: retry it later, but never let it hold up the others
export const isRecordProblem = (kind: ErrorKind) =>
  kind === "data" || kind === "permission" || kind === "bug";

export const messageOf = (e: unknown) => {
  const m = (e as { message?: unknown } | null)?.message;
  return typeof m === "string" && m ? m : String(e);
};

// What is saved in the queue's lastError: a short tag first, so the screen can explain it in plain words
export function tagFor(kind: ErrorKind, raw: string): string {
  if (kind === "bug") return `BUG: ${raw}`;
  if (kind === "permission") return `PERMISSION: ${raw}`;
  return raw;
}
