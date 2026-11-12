-- Day 27 gate: automatic checks of the database, for the mistakes that leak patient data.
-- Run it in the Supabase SQL Editor (it only reads, it changes nothing). Run it again before every pilot clinic and after every day that touches the database.
-- FAIL = fix before any real patient data.  REVIEW = a person must look and decide (the reason is in the detail).  PASS = nothing found.

with
tbl as (
  select c.oid, c.relname, c.relrowsecurity as rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
),
fn as (
  select p.oid, p.proname, p.prosecdef as definer, p.proconfig
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f'
),
-- functions that only the server may run: no signed-in person and no visitor may ever call them
server_only(name) as (values
  ('begin_payment'), ('apply_payment'), ('apply_renewal'), ('note_subscription'), ('mark_past_due'), ('mark_cancelling'),
  ('get_cancel_target'), ('grant_pilot'), ('expire_plans'), ('expire_one'), ('extend_billing')
),
checks as (
  select 1 as n, 'Row level security is on for every table' as "check",
    case when count(*) filter (where not rls) = 0 then 'PASS' else 'FAIL' end as status,
    coalesce(string_agg(relname, ', ' order by relname) filter (where not rls), 'all ' || count(*) || ' tables') as detail,
    'alter table public.<name> enable row level security;' as fix
  from tbl

  union all
  select 2, 'A signed-out visitor (anon) has no access to any table',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    coalesce(string_agg(distinct table_name, ', '), 'none'),
    'revoke all on all tables in schema public from anon;'
  from information_schema.role_table_grants where table_schema = 'public' and grantee = 'anon'

  union all
  select 3, 'No function that runs with the owner''s rights (security definer) can be called by a signed-out visitor, except keepalive',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    coalesce(string_agg(proname, ', ' order by proname), 'none'),
    'revoke execute on function public.<name>(<args>) from public, anon;'
  from fn where definer and proname <> 'keepalive' and has_function_privilege('anon', oid, 'execute')

  union all
  select 4, 'Every function that runs with the owner''s rights has a fixed search_path (otherwise it can be tricked)',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    coalesce(string_agg(proname, ', ' order by proname), 'none'),
    'alter function public.<name>(<args>) set search_path = '''';'
  from fn where definer and not exists (select 1 from unnest(coalesce(proconfig, '{}')) cfg where cfg like 'search_path=%')

  union all
  select 5, 'Payment and billing functions can only be run by the server, never by a signed-in person or a visitor',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    coalesce(string_agg(proname, ', ' order by proname), 'none'),
    'revoke execute on function public.<name>(<args>) from public, anon, authenticated;'
  from fn where proname in (select name from server_only) and (has_function_privilege('anon', oid, 'execute') or has_function_privilege('authenticated', oid, 'execute'))

  union all
  select 6, 'The audit log cannot be changed or erased by anyone signed in',
    case
      when to_regclass('public.audit_log') is null then 'REVIEW'
      when has_table_privilege('authenticated', 'public.audit_log', 'update') or has_table_privilege('authenticated', 'public.audit_log', 'delete')
        or has_table_privilege('authenticated', 'public.audit_log', 'truncate') or has_table_privilege('anon', 'public.audit_log', 'select') then 'FAIL'
      else 'PASS' end,
    case when to_regclass('public.audit_log') is null then 'there is no table called audit_log: find out where the audit trail lives' else 'checked update, delete, truncate and anonymous reading' end,
    'revoke update, delete, truncate on public.audit_log from authenticated, anon;'

  union all
  select 7, 'Nobody can give a facility a paid plan by editing the table',
    case
      when to_regclass('public.facilities') is null then 'REVIEW'
      when has_column_privilege('authenticated', 'public.facilities', 'plan', 'update') or has_column_privilege('anon', 'public.facilities', 'plan', 'update') then 'FAIL'
      else 'PASS' end,
    case when to_regclass('public.facilities') is null then 'there is no table called facilities' else 'checked the plan column for signed-in people and visitors' end,
    'revoke update on public.facilities from authenticated, anon;'

  union all
  select 8, 'Tables that hold a facility''s data are limited to that facility by a policy',
    case when count(*) = 0 then 'PASS' else 'REVIEW' end,
    coalesce(string_agg(t.relname, ', ' order by t.relname), 'every table with a facility_id has a policy that mentions the facility'),
    'create policy ... using (facility_id in (select ...)); a person must read each one and confirm it is right'
  from tbl t
  where exists (select 1 from pg_attribute a where a.attrelid = t.oid and a.attname = 'facility_id' and not a.attisdropped)
    and exists (select 1 from pg_policies p0 where p0.schemaname = 'public' and p0.tablename = t.relname) -- tables with no policy at all are check 9
    and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.relname and (coalesce(p.qual, '') || coalesce(p.with_check, '')) ilike '%facilit%')

  union all
  select 9, 'Tables that have row level security but no policy at all (fine for server-only tables, a mistake for anything else)',
    case when count(*) = 0 then 'PASS' else 'REVIEW' end,
    coalesce(string_agg(relname, ', ' order by relname), 'none'),
    'confirm each one is meant for the server only (secrets, billing)'
  from tbl where rls and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = tbl.relname)

  union all
  select 10, 'Policies that also apply to a signed-out visitor (they should read auth.uid(), so a visitor sees nothing)',
    case when count(*) = 0 then 'PASS' else 'REVIEW' end,
    coalesce(string_agg(distinct tablename || '.' || policyname, ', '), 'none'),
    'add "to authenticated" to the policy, so it never applies to a visitor at all'
  from pg_policies where schemaname = 'public' and ('anon' = any(roles) or 'public' = any(roles))

  union all
  select 11, 'Views skip row level security unless they are made to respect it',
    case when count(*) = 0 then 'PASS' else 'REVIEW' end,
    coalesce(string_agg(c.relname, ', ' order by c.relname), 'no views'),
    'alter view public.<name> set (security_invoker = true);'
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v' and not coalesce('security_invoker=true' = any(c.reloptions), false)

  union all
  select 12, 'Extensions installed (look for anything you do not recognise)',
    'REVIEW', coalesce(string_agg(extname, ', ' order by extname), 'none'), 'remove what you do not use: drop extension <name>;'
  from pg_extension

  union all
  select 13, 'Nobody signed in, and no visitor, may TRUNCATE a table, or add references or triggers to it (supabase/day30.sql takes these rights away)',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    coalesce(string_agg(g.table_name || ' (' || g.grantee || ' ' || g.privilege_type || ')', ', ' order by g.table_name, g.grantee, g.privilege_type), 'none'),
    'run supabase/day30.sql again, then find out why a table has the rights back (a new table, or a grant written by hand)'
  from information_schema.role_table_grants g
  where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated') and g.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')

  union all
  select 14, 'Helper functions that only triggers and other functions call are closed to visitors and signed in people (supabase/day30.sql)',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    coalesce(string_agg(p.proname, ', ' order by p.proname), 'none'),
    'revoke execute on function public.<name> from public, anon, authenticated;'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('keep_sent_final', 'touch_synced_at', 'patient_limit')
    and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
)
select "check", status, detail, case when status = 'PASS' then '' else fix end as "how to fix"
from checks
order by case status when 'FAIL' then 0 when 'REVIEW' then 1 else 2 end, n;

-- Not checkable from SQL, so check by hand in the Supabase dashboard (Authentication and Settings):
--  * Email confirmation is required before sign-in.
--  * The password length is at least 8 and leaked-password protection is on, if your plan has it.
--  * Redirect URLs and the Site URL list only your own addresses.
--  * Project Settings > API: the service_role key is not in any file of the app or any message.
--  * Backups: the plan you are on says how long data is kept (Free has none you can restore from: your own backup button matters).

-- Fix helper for check 3 (and only check 3). Run THIS on its own: it only prints statements, it changes nothing. READ what it prints,
-- then run the lines you agree with. They take the function away from visitors, and keep it for signed-in people and for the server.
-- (Do not run a plain "revoke ... from public" yourself: signed-in people get their access through public, and would lose it.)
--
--   select format('revoke execute on function %1$I.%2$I(%3$s) from public, anon; grant execute on function %1$I.%2$I(%3$s) to authenticated, service_role;', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) as statement
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.prokind = 'f' and p.prosecdef and p.proname <> 'keepalive'
--     and p.proname not in ('begin_payment', 'apply_payment', 'apply_renewal', 'note_subscription', 'mark_past_due', 'mark_cancelling', 'get_cancel_target', 'grant_pilot', 'expire_plans', 'expire_one', 'extend_billing')
--     and has_function_privilege('anon', p.oid, 'execute');
--
-- Fix for check 2, and so that new tables never start open to visitors again:
--   revoke all on all tables in schema public from anon;
--   alter default privileges in schema public revoke all on tables from anon;
--   alter default privileges in schema public revoke execute on functions from anon;