-- A fingerprint of everything in the "public" schema: tables and their columns, views, functions (the exact code),
-- policies, triggers, indexes, and who may do what (anon, authenticated, service_role and everyone).
-- Run it in BOTH Supabase projects, press "Download CSV" on each result, and compare with:
--     node scripts/schema-diff.mjs staging.csv production.csv
-- It only reads. It shows no patient data: only names and short fingerprints of the structure.
with tbl as (
  select c.oid, c.relname, c.relacl, c.relrowsecurity, c.relforcerowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
),
cols as (
  select t.relname,
         string_agg(a.attname || ':' || format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull::text || ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), ''), ',' order by a.attname) as def
  from tbl t
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = t.oid and d.adnum = a.attnum
  group by t.relname
),
fn as (
  select p.oid, p.proacl, 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as sig -- always the full name, whatever the session's search path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind in ('f', 'p')
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') -- not part of an extension
)
select 'table' as kind, t.relname as name,
       md5(coalesce(c.def, '') || '|rls=' || t.relrowsecurity::text || '|force=' || t.relforcerowsecurity::text) as fingerprint
from tbl t left join cols c using (relname)
union all
select 'view', c.relname, md5(replace(pg_get_viewdef(c.oid), chr(13), ''))
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm')
union all
select 'function', f.sig, md5(replace(pg_get_functiondef(f.oid), chr(13), '')) from fn f -- chr(13) is the Windows line-ending character: it must not count as a difference
union all
select 'policy', p.tablename || ' / ' || p.policyname,
       md5(p.cmd || '|' || p.roles::text || '|' || coalesce(p.qual, '') || '|' || coalesce(p.with_check, ''))
from pg_policies p where p.schemaname = 'public'
union all
select 'trigger', c.relname || ' / ' || t.tgname, md5(pg_get_triggerdef(t.oid))
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
union all
select 'index', i.indexname, md5(i.indexdef) from pg_indexes i where i.schemaname = 'public'
union all
select 'table grants', t.relname,
       md5((select coalesce(string_agg(g, ',' order by g), '')
            from (select (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) || ':' || x.privilege_type as g
                  from aclexplode(t.relacl) x) s
            where g ~ '^(PUBLIC|anon|authenticated|service_role):'))
from tbl t
union all
select 'function grants', f.sig,
       md5((select coalesce(string_agg(g, ',' order by g), '')
            from (select (case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end) || ':' || x.privilege_type as g
                  from aclexplode(f.proacl) x) s
            where g ~ '^(PUBLIC|anon|authenticated|service_role):'))
from fn f
order by 1, 2;

-- A second, separate query (run it on its own): do both projects hold the same price list?
-- Download its CSV too, and compare the two files the same way. The Paystack plan codes legitimately
-- differ once production goes LIVE, so expect a difference then.
-- select 'seed' as kind, 'billing_plans' as name, md5(coalesce(string_agg(t::text, '|' order by t::text), '')) as fingerprint from public.billing_plans t;