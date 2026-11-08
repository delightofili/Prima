// Checks that your SQL files can rebuild the database. Run from the project root:   node scripts/check-sql-files.mjs
// It reads supabase/*.sql and changes nothing. The lists below are every table, function, trigger, policy and index
// that exists in your staging database (from the fingerprint you ran on 7 November 2026).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const EXPECTED = {
  table:
    "audit_log billing_customers billing_plans data_requests device_status facilities facility_billing facility_secrets guardians immunization_records invites memberships notice_acceptances patients payments profiles reminders visits",
  function:
    "accept_notice apply_payment apply_renewal audit_events audit_stamp begin_payment billing_grace_days create_facility create_invite cycle_days cycle_interval enforce_patient_limit erase_patient expire_one expire_plans extend_billing facility_pulse get_billing get_cancel_target get_sync_key grant_pilot guard_patient_changes handle_new_user ignore_stale_write ignore_stale_write_erasable is_admin_of join_facility keep_sent_final keepalive list_devices list_invites list_members log_event mark_cancelling mark_past_due max_staff my_admin_facility my_facility_ids my_notices new_sync_key note_subscription patient_limit plan_rank plan_usage remove_device remove_member rename_device report_device revoke_invite rotate_key_on_member_removal rotate_sync_key server_time touch_synced_at update_facility user_in_facility",
  trigger:
    "audit_log_stamp data_requests_audit facilities_audit guardians_00_stale guardians_touch immunization_records_00_stale immunizations_touch invites_audit memberships_audit memberships_rotate_key patients_00_stale patients_guard patients_limit patients_touch reminders_00_stale reminders_sent_final reminders_touch visits_00_stale visits_touch",
  index:
    "audit_facility_time_idx data_requests_facility_idx device_status_facility_idx guardians_fac_synced_idx guardians_facility_idx guardians_patient_idx guardians_phone_idx guardians_synced_idx immunization_due_idx immunization_patient_idx immunizations_fac_synced_idx immunizations_facility_idx immunizations_synced_idx memberships_facility_idx patients_dob_idx patients_fac_synced_idx patients_facility_idx patients_guardian_idx patients_synced_idx payments_facility_idx reminders_fac_synced_idx reminders_facility_idx reminders_patient_idx reminders_queue_idx reminders_synced_idx visits_date_idx visits_due_idx visits_dx_idx visits_fac_synced_idx visits_patient_idx visits_synced_idx",
};
export const POLICIES = [
  "admins read audit",
  "members add audit",
  "anyone signed in reads prices",
  "admins manage requests",
  "members read facility",
  "members insert",
  "members read",
  "members update",
  "read own membership",
  "read own or admin",
  "admins read their payments",
  "read own profile",
  "update own profile",
];
export const COLUMNS = [["patients", "dob_estimated"]]; // a column added by a one-line ALTER on Day 19, which is easy to forget
const NOT_SCHEMA = new Set(["gate.sql", "inventory.sql", "permissions.sql"]); // these read or tidy permissions; they create no tables or functions

const strip = (sql) =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .toLowerCase();
const RX = {
  table: (n) =>
    new RegExp(
      `create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:public\\.)?"?${n}"?\\s*\\(`,
    ),
  function: (n) =>
    new RegExp(
      `create\\s+(?:or\\s+replace\\s+)?function\\s+(?:public\\.)?"?${n}"?\\s*\\(`,
    ),
  trigger: (n) =>
    new RegExp(`create\\s+(?:or\\s+replace\\s+)?trigger\\s+"?${n}"?\\s`),
  index: (n) =>
    new RegExp(
      `create\\s+(?:unique\\s+)?index\\s+(?:concurrently\\s+)?(?:if\\s+not\\s+exists\\s+)?"?${n}"?\\s`,
    ),
};
const hasPolicy = (t, name) =>
  new RegExp(
    `create\\s+policy\\s+"${name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
  ).test(t);
const hasColumn = (t, table, col) =>
  new RegExp(`${col}\\s+[a-z]`).test(t) &&
  new RegExp(
    `(?:alter\\s+table\\s+(?:only\\s+)?(?:public\\.)?${table}\\b[\\s\\S]{0,200}?add\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?${col}\\b|create\\s+table[^;]*?${table}\\s*\\([\\s\\S]*?\\b${col}\\b)`,
  ).test(t);

// files: { "schema.sql": "text", ... }  ->  what is covered, what is missing, and which day files you must run
export function analyse(files) {
  const sources = Object.keys(files)
    .filter((f) => !NOT_SCHEMA.has(f))
    .sort();
  const text = Object.fromEntries(sources.map((f) => [f, strip(files[f])]));
  const where = (test) => sources.filter((f) => test(text[f]));
  const found = [],
    missing = [],
    onlyIn = {};
  for (const [kind, list] of Object.entries(EXPECTED))
    for (const n of list.split(" ")) {
      const w = where((t) => RX[kind](n).test(t));
      (w.length ? found : missing).push({ kind, name: n, files: w });
    }
  for (const n of POLICIES) {
    const w = where((t) => hasPolicy(t, n));
    (w.length ? found : missing).push({ kind: "policy", name: n, files: w });
  }
  for (const [tb, col] of COLUMNS) {
    const w = where((t) => hasColumn(t, tb, col));
    (w.length ? found : missing).push({
      kind: "column",
      name: `${tb}.${col}`,
      files: w,
    });
  }
  // a file must be run in step B6 if it holds something schema.sql does not
  const base = sources.includes("schema.sql") ? "schema.sql" : null;
  for (const f of sources)
    if (f !== base)
      onlyIn[f] = found.filter(
        (o) => o.files.includes(f) && !(base && o.files.includes(base)),
      ).length;
  const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });
  const mustRun = [
    ...(base ? [base] : []),
    ...sources.filter((f) => f !== base && onlyIn[f] > 0).sort(natural),
  ];
  return {
    sources,
    found,
    missing,
    mustRun,
    total: found.length + missing.length,
  };
}

export function main(dir = "supabase", log = console.log) {
  if (!existsSync(dir)) {
    log(`There is no ${dir} folder. Run this from the project root.`);
    return 2;
  }
  const files = Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => [f, readFileSync(join(dir, f), "utf8")]),
  );
  const r = analyse(files);
  log(
    `\nSQL files read: ${Object.keys(files).sort().join(", ") || "(none)"}\n`,
  );
  if (!r.sources.length) {
    log(
      "No SQL files found. Tell me and I will rebuild them from our saved conversations.",
    );
    return 1;
  }
  const byKind = {};
  for (const o of r.found) (byKind[o.kind] ??= { ok: 0, bad: 0 }).ok++;
  for (const o of r.missing) (byKind[o.kind] ??= { ok: 0, bad: 0 }).bad++;
  for (const [k, v] of Object.entries(byKind))
    log(
      `  ${v.bad ? "NO " : "OK "} ${k.padEnd(9)} ${v.ok} of ${v.ok + v.bad} found`,
    );
  if (r.missing.length) {
    log(
      "\nMISSING: these exist in your staging database, but no SQL file you have creates them:\n",
    );
    for (const o of r.missing) log(`  ${o.kind.padEnd(9)} ${o.name}`);
    log(
      "\nSend me this list and I will give you the exact SQL from our saved conversations.\n",
    );
    return 1;
  }
  log(
    `\nEverything in staging (${r.total} things) is created by a file you have.\n\nFor the production database (step B6), run these, in this order:\n${r.mustRun.map((f, i) => `  ${i + 1}. supabase/${f}`).join("\n")}\n  then supabase/permissions.sql\n\nSkip any other day file: its contents are already inside schema.sql.\n`,
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(main());
