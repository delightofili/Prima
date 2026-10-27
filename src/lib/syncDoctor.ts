import { db } from "../db";
import { supabase } from "./supabase";
import { classify, messageOf } from "./syncErrors";
import { getSyncHealth } from "./syncHealth";
import type { SyncItem } from "../types";

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

interface Need {
  table: string;
  column: string;
  day: number;
  sql?: string;
}

// What the cloud database must have for this version of Prima. Each line is one thing that earlier days added.
const NEEDS: Need[] = [
  { table: "patients", column: "synced_at", day: 6 },
  { table: "patients", column: "merged_into_id", day: 9 },
  { table: "patients", column: "guardian_id", day: 11 },
  { table: "patients", column: "sms_consent", day: 12 },
  { table: "patients", column: "notice_given_at", day: 14 },
  { table: "patients", column: "erased_at", day: 14 },
  {
    table: "patients",
    column: "dob_estimated",
    day: 19,
    sql: "alter table public.patients add column if not exists dob_estimated boolean not null default false;",
  },
  { table: "visits", column: "erased_at", day: 14 },
  { table: "immunization_records", column: "synced_at", day: 6 },
  { table: "guardians", column: "sms_consent", day: 12 },
  { table: "reminders", column: "id", day: 12 },
  { table: "audit_log", column: "id", day: 14 },
  { table: "data_requests", column: "id", day: 14 },
];

const FUNCTIONS = [
  { name: "facility_pulse", day: 15 },
  { name: "plan_usage", day: 15 },
];

export async function checkCloud(): Promise<Check[]> {
  const out: Check[] = [];

  out.push({
    name: "Internet",
    ok: navigator.onLine,
    detail: navigator.onLine
      ? "This phone says it is online."
      : "This phone says it is offline.",
    fix: navigator.onLine ? undefined : "Connect to Wi-Fi or mobile data.",
  });

  let signedIn = false;
  try {
    const { data } = await supabase.auth.getSession();
    signedIn = !!data.session;
    const until = data.session?.expires_at
      ? new Date(data.session.expires_at * 1000).toLocaleString("en-NG")
      : "";
    out.push({
      name: "Cloud sign-in",
      ok: signedIn,
      detail: signedIn
        ? `Signed in${until ? `, current pass valid until ${until}` : ""}.`
        : "Not signed in to the cloud.",
      fix: signedIn ? undefined : "Sign out and sign in again while online.",
    });
  } catch (e) {
    out.push({ name: "Cloud sign-in", ok: false, detail: messageOf(e) });
  }
  if (!navigator.onLine || !signedIn) return out;

  const t0 = performance.now();
  const reach = await supabase.from("facilities").select("id").limit(1);
  const ms = Math.round(performance.now() - t0);
  out.push({
    name: "Reaching the cloud",
    ok: !reach.error,
    detail: reach.error
      ? `${classify(reach.error)}: ${messageOf(reach.error)}`
      : `Answered in ${ms} ms.`,
    fix: reach.error
      ? "If this says network or timeout, the connection or the Supabase project is the problem. Open the Supabase dashboard and check the project is not paused."
      : undefined,
  });
  if (reach.error) return out;

  for (const n of NEEDS) {
    const { error } = await supabase.from(n.table).select(n.column).limit(1);
    const kind = error ? classify(error) : null;
    out.push({
      name: `${n.table}.${n.column}`,
      ok: !error,
      detail: error ? `${kind}: ${messageOf(error)}` : "Present.",
      fix: error
        ? kind === "schema"
          ? n.sql
            ? `Missing. Run this in the Supabase SQL Editor: ${n.sql}`
            : `Missing. Run the Day ${n.day} SQL from schema.sql in the Supabase SQL Editor.`
          : "Could not check it. See the message."
        : undefined,
    });
  }

  for (const f of FUNCTIONS) {
    const { error } = await supabase.rpc(f.name);
    const missing = !!error && classify(error) === "schema";
    out.push({
      name: `function ${f.name}`,
      ok: !missing,
      detail: missing ? "Missing." : "Present.",
      fix: missing
        ? `Run the Day ${f.day} SQL in the Supabase SQL Editor.`
        : undefined,
    });
  }
  return out;
}

export async function queueSummary() {
  const items = await db.syncQueue.toArray();
  const byTable = new Map<string, { pending: number; failed: number }>();
  for (const i of items) {
    const row = byTable.get(i.table) ?? { pending: 0, failed: 0 };
    if (i.status === "failed") row.failed++;
    else row.pending++;
    byTable.set(i.table, row);
  }
  return { items, byTable };
}

// Puts every record back in the upload queue. Safe: uploading is an update-or-insert, so nothing doubles.
export async function requeueAll(): Promise<number> {
  const now = Date.now();
  const items: SyncItem[] = [];
  const add = (table: SyncItem["table"], ids: string[]) =>
    ids.forEach((id) =>
      items.push({
        table,
        recordId: id,
        attempts: 0,
        status: "pending",
        createdAt: now,
      }),
    );
  add(
    "guardians",
    (await db.guardians.toArray()).map((r) => r.id),
  );
  add(
    "patients",
    (await db.patients.toArray()).map((r) => r.id),
  );
  add(
    "visits",
    (await db.visits.toArray()).map((r) => r.id),
  );
  add(
    "immunizations",
    (await db.immunizations.toArray()).map((r) => r.id),
  );
  add(
    "reminders",
    (await db.reminders.toArray()).map((r) => r.id),
  );
  await db.syncQueue.bulkAdd(items);
  return items.length;
}

// Forget what was already downloaded, so the next download fetches everything again
export async function forgetDownloadProgress() {
  const keys = (await db.meta.toArray())
    .map((m) => m.key)
    .filter((k) => k === "pulse" || k.startsWith("cursor:"));
  await db.meta.bulkDelete(keys);
}

export const discardItem = (id: number) => db.syncQueue.delete(id);

export async function buildReport(checks: Check[]): Promise<string> {
  const h = getSyncHealth();
  const { items, byTable } = await queueSummary();
  const lines = [
    `Prima sync report, ${new Date().toLocaleString("en-NG")}`,
    `Build: ${typeof __BUILD__ === "string" ? __BUILD__ : "unknown"}`,
    `Online: ${navigator.onLine}`,
    `Failures in a row: ${h.failures}, working now: ${h.working}, last success: ${h.lastOkAt ? new Date(h.lastOkAt).toLocaleTimeString("en-NG") : "never"}`,
    `Stalled: ${h.stalledAt ? new Date(h.stalledAt).toLocaleTimeString("en-NG") : "no"}`,
    `Cloud database problem: ${h.schemaProblem ?? "none"}`,
    `Latest trouble: ${h.problem ? `${h.problem.kind} in ${h.problem.where}: ${h.problem.message}` : "none"}`,
    "",
    "Queue:",
    ...[...byTable.entries()].map(
      ([t, c]) => `  ${t}: ${c.pending} waiting, ${c.failed} need attention`,
    ),
    "",
    "First 20 items:",
    ...items
      .slice(0, 20)
      .map(
        (i) =>
          `  #${i.id} ${i.table} ${i.recordId.slice(0, 8)} ${i.status} tries=${i.attempts} ${i.lastError ?? ""}`,
      ),
    "",
    "Checks:",
    ...checks.map(
      (c) =>
        `  ${c.ok ? "OK  " : "FAIL"} ${c.name}: ${c.detail}${c.fix ? ` -> ${c.fix}` : ""}`,
    ),
  ];
  return lines.join("\n");
}
