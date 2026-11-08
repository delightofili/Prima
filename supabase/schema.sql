-- Prima: the whole database, rebuilt from every SQL file given on Days 1 to 27.
-- It makes every table, function, trigger, policy and index in the staging database, in the order they were first made.
-- Run it ONCE on a NEW, EMPTY Supabase project (the SQL Editor can take the whole file), then run supabase/permissions.sql.
-- Do not run it on a project that already has these tables: it would stop with "already exists".

-- ======================================================================
-- Days 1 to 13: the tables, row level security, invites, soft delete, guardians and vaccines
-- ======================================================================
-- TABLES
create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  lga text not null,
  state text not null,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key,
  facility_id uuid not null references public.facilities(id),
  card_number text not null unique,
  full_name text not null,
  name_key text not null,
  dob date not null,
  gender text not null check (gender in ('MALE','FEMALE')),
  phone text,
  village text not null,
  village_key text not null,
  lga text not null,
  state text not null,
  next_of_kin_name text not null,
  next_of_kin_phone text not null,
  nhis_number text unique,
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies text,
  para int,
  gravida int,
  is_pregnant boolean not null default false,
  initial_chief_complaint text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table public.immunization_records (
  id uuid primary key,
  patient_id uuid not null references public.patients(id) on delete cascade,
  vaccine_name text not null,
  dose_number int not null check (dose_number between 0 and 10),
  date_given date not null,
  next_due_date date,
  created_at timestamptz not null
);

create index patients_facility_idx on public.patients (facility_id);
create index patients_dob_idx on public.patients (dob);
create index immunization_patient_idx on public.immunization_records (patient_id);
create index immunization_due_idx on public.immunization_records (next_due_date);

-- GRANTS (new Supabase projects need these before the API can touch a table)
grant usage on schema public to anon, authenticated, service_role;
grant select on public.facilities to anon, authenticated;
grant select, insert, update on public.patients, public.immunization_records to anon, authenticated;
grant all on public.facilities, public.patients, public.immunization_records to service_role;

-- ROW LEVEL SECURITY
alter table public.facilities enable row level security;
alter table public.patients enable row level security;
alter table public.immunization_records enable row level security;

-- !! TEMPORARY, DAY 3 ONLY. Anyone with the key can read and write. FAKE DATA ONLY.
-- Day 4 deletes these and adds policies like:
--   using (facility_id = (select facility_id from public.profiles where id = auth.uid()))
create policy "TEMP day3 read facilities" on public.facilities for select to anon using (true);
create policy "TEMP day3 anon patients" on public.patients for all to anon using (true) with check (true);
create policy "TEMP day3 anon immunizations" on public.immunization_records for all to anon using (true) with check (true);

-- SEED YOUR FACILITY (the result shows its id. COPY IT)
insert into public.facilities (name, code, lga, state)
values ('Awka North PHC', 'ANK', 'Awka North', 'Anambra')
returning id;

create table public.visits (
  id uuid primary key,
  facility_id uuid not null references public.facilities(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_date date not null,
  complaints text not null,
  systolic int check (systolic between 50 and 300),
  diastolic int check (diastolic between 30 and 200),
  temperature numeric(4,1) check (temperature between 30 and 45),
  weight_kg numeric(5,1) check (weight_kg between 0.5 and 300),
  diagnosis_code text,
  diagnosis_label text,
  treatment text,
  next_due_date date,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index visits_patient_idx on public.visits (patient_id);
create index visits_date_idx on public.visits (visit_date);
create index visits_due_idx on public.visits (next_due_date);
create index visits_dx_idx on public.visits (diagnosis_code);

grant select, insert, update on public.visits to anon, authenticated;
grant all on public.visits to service_role;

alter table public.visits enable row level security;

-- TEMPORARY, fake data only. Removed on Day 10 when Auth + RLS arrive.
create policy "TEMP day5 anon visits" on public.visits for all to anon using (true) with check (true);

-- Soft delete
alter table public.patients add column deleted_at timestamptz;
alter table public.visits add column deleted_at timestamptz;

-- Immunization records get the same sync fields as the other tables
alter table public.immunization_records
  add column facility_id uuid references public.facilities(id),
  add column updated_at timestamptz not null default now(),
  add column deleted_at timestamptz,
  add column next_vaccine_label text;

update public.immunization_records r
set facility_id = p.facility_id
from public.patients p
where p.id = r.patient_id;

-- Server sync clock: set by the database, never by a phone
alter table public.patients add column synced_at timestamptz not null default now();
alter table public.visits add column synced_at timestamptz not null default now();
alter table public.immunization_records add column synced_at timestamptz not null default now();

create or replace function public.touch_synced_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at = now();
  return new;
end;
$$;

create trigger patients_touch before insert or update on public.patients
  for each row execute function public.touch_synced_at();
create trigger visits_touch before insert or update on public.visits
  for each row execute function public.touch_synced_at();
create trigger immunizations_touch before insert or update on public.immunization_records
  for each row execute function public.touch_synced_at();

create index patients_synced_idx on public.patients (synced_at);
create index visits_synced_idx on public.visits (synced_at);
create index immunizations_synced_idx on public.immunization_records (synced_at);
create index immunizations_facility_idx on public.immunization_records (facility_id);

alter table public.patients
  add column merged_into_id uuid references public.patients(id);

create table public.guardians (
  id uuid primary key,
  facility_id uuid not null references public.facilities(id),
  full_name text not null,
  name_key text not null,
  phone text,
  relationship text not null
    check (relationship in ('MOTHER','FATHER','GRANDPARENT','SIBLING','AUNT_UNCLE','OTHER')),
  patient_id uuid references public.patients(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create index guardians_facility_idx on public.guardians (facility_id);
create index guardians_phone_idx on public.guardians (phone);
create index guardians_patient_idx on public.guardians (patient_id);
create index guardians_synced_idx on public.guardians (synced_at);

create trigger guardians_touch before insert or update on public.guardians
  for each row execute function public.touch_synced_at();

alter table public.patients
  add column guardian_id uuid references public.guardians(id);
create index patients_guardian_idx on public.patients (guardian_id);

grant select, insert, update on public.guardians to anon, authenticated;
grant all on public.guardians to service_role;
alter table public.guardians enable row level security;

-- TEMPORARY, fake data only. Replaced by real policies on the Auth day.
create policy "TEMP day11 anon guardians" on public.guardians for all to anon using (true) with check (true);

alter table public.patients
  add column sms_consent boolean not null default false,
  add column sms_consent_at timestamptz;

alter table public.guardians
  add column sms_consent boolean not null default false,
  add column sms_consent_at timestamptz;

create table public.reminders (
  id text primary key,
  facility_id uuid not null references public.facilities(id),
  patient_id uuid not null references public.patients(id),
  kind text not null check (kind in ('visit','vaccine')),
  source_id text not null,
  title text not null,
  due_date date not null,
  send_on date not null,
  phone text not null,
  recipient text not null check (recipient in ('patient','guardian')),
  message text not null,
  status text not null default 'pending' check (status in ('pending','sent','cancelled')),
  sent_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now()
);

create index reminders_facility_idx on public.reminders (facility_id);
create index reminders_patient_idx on public.reminders (patient_id);
create index reminders_queue_idx on public.reminders (status, send_on);
create index reminders_synced_idx on public.reminders (synced_at);

-- "Sent" is final: no device can turn a sent reminder back into pending.
create or replace function public.keep_sent_final()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'sent' then
    new.status := 'sent';
    new.sent_at := old.sent_at;
  end if;
  return new;
end;
$$;

create trigger reminders_sent_final before update on public.reminders
  for each row execute function public.keep_sent_final();
create trigger reminders_touch before insert or update on public.reminders
  for each row execute function public.touch_synced_at();

grant select, insert, update on public.reminders to anon, authenticated;
grant all on public.reminders to service_role;
alter table public.reminders enable row level security;

-- TEMPORARY, fake data only. Replaced by real policies on the Auth day.
create policy "TEMP day12 anon reminders" on public.reminders for all to anon using (true) with check (true);


-- ======================================================================
-- Day 14: audit log, erase patient, data requests, the patient cap, keep-alive
-- ======================================================================
-- 0. Every vaccine record must belong to a facility (RLS needs it)
update public.immunization_records r
set facility_id = p.facility_id
from public.patients p
where p.id = r.patient_id and r.facility_id is null;
alter table public.immunization_records alter column facility_id set not null;

-- 1. A facility has a plan (only the project owner can change it)
alter table public.facilities
  add column plan text not null default 'free' check (plan in ('free','basic','pro'));

-- 2. People
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  role text not null check (role in ('admin','staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, facility_id)
);
create index memberships_facility_idx on public.memberships (facility_id);

create table public.invites (
  code text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  role text not null default 'staff' check (role in ('admin','staff')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz
);

-- A profile is created automatically for every new account
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- 3. Helpers
create or replace function public.my_facility_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select facility_id from public.memberships where user_id = (select auth.uid());
$$;

-- Staff accounts allowed per plan. The Pro number is a placeholder.
create or replace function public.max_staff(p_plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case p_plan when 'basic' then 3 when 'pro' then 10 else 1 end;
$$;

create or replace function public.my_admin_facility()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  fid uuid;
begin
  select facility_id into fid
  from public.memberships
  where user_id = (select auth.uid()) and role = 'admin'
  limit 1;
  if fid is null then
    raise exception 'Only a facility admin can do this.' using errcode = '42501';
  end if;
  return fid;
end;
$$;

-- 4. Actions (the only way to create or change teams)
create or replace function public.create_facility(p_name text, p_code text, p_lga text, p_state text)
returns public.facilities
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text := upper(trim(p_code));
  fac public.facilities;
begin
  if v_uid is null then
    raise exception 'Please sign in.' using errcode = '42501';
  end if;
  if exists (select 1 from public.memberships where user_id = v_uid) then
    raise exception 'You already belong to a facility.';
  end if;
  if length(trim(p_name)) < 3 then
    raise exception 'Enter the facility name.';
  end if;
  if v_code !~ '^[A-Z]{2,5}$' then
    raise exception 'The facility code must be 2 to 5 letters.';
  end if;
  if length(trim(p_lga)) < 2 or length(trim(p_state)) < 2 then
    raise exception 'Enter the LGA and the state.';
  end if;

  begin
    insert into public.facilities (name, code, lga, state)
    values (trim(p_name), v_code, trim(p_lga), trim(p_state))
    returning * into fac;
  exception when unique_violation then
    raise exception 'That facility code is already in use. Choose another.';
  end;

  insert into public.memberships (user_id, facility_id, role) values (v_uid, fac.id, 'admin');
  return fac;
end;
$$;

create or replace function public.create_invite(p_role text default 'staff')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
  v_code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
begin
  if p_role not in ('admin','staff') then
    raise exception 'Choose staff or admin.';
  end if;
  insert into public.invites (code, facility_id, role, created_by, expires_at)
  values (v_code, fid, p_role, (select auth.uid()), now() + interval '7 days');
  return v_code;
end;
$$;

create or replace function public.join_facility(p_code text)
returns public.facilities
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  inv public.invites;
  fac public.facilities;
  seats int;
begin
  if v_uid is null then
    raise exception 'Please sign in.' using errcode = '42501';
  end if;
  if exists (select 1 from public.memberships where user_id = v_uid) then
    raise exception 'You already belong to a facility.';
  end if;

  select * into inv from public.invites
  where code = replace(upper(trim(p_code)), '-', '')
  for update;

  -- One message for every kind of failure, so nobody can probe which codes exist
  if not found or inv.used_at is not null or inv.expires_at < now() then
    raise exception 'This invite code is not valid or has expired.';
  end if;

  select * into fac from public.facilities where id = inv.facility_id;
  select count(*) into seats from public.memberships where facility_id = fac.id;
  if seats >= public.max_staff(fac.plan) then
    raise exception 'This facility has reached the limit of % staff accounts for its plan.', public.max_staff(fac.plan);
  end if;

  insert into public.memberships (user_id, facility_id, role) values (v_uid, fac.id, inv.role);
  update public.invites set used_by = v_uid, used_at = now() where code = inv.code;
  return fac;
end;
$$;

create or replace function public.list_invites()
returns table (code text, role text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
begin
  return query
    select i.code, i.role, i.expires_at
    from public.invites i
    where i.facility_id = fid and i.used_at is null and i.expires_at > now()
    order by i.created_at desc;
end;
$$;

create or replace function public.revoke_invite(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
begin
  delete from public.invites
  where facility_id = fid and code = replace(upper(trim(p_code)), '-', '') and used_at is null;
end;
$$;

create or replace function public.list_members()
returns table (user_id uuid, full_name text, email text, role text, joined_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
begin
  return query
    select m.user_id, p.full_name, u.email::text, m.role, m.created_at
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    join auth.users u on u.id = m.user_id
    where m.facility_id = fid
    order by m.created_at;
end;
$$;

create or replace function public.remove_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
begin
  if p_user_id = (select auth.uid()) then
    raise exception 'You cannot remove yourself.';
  end if;
  delete from public.memberships where facility_id = fid and user_id = p_user_id;
  if not found then
    raise exception 'That person is not on your team.';
  end if;
end;
$$;

create or replace function public.update_facility(p_name text, p_lga text, p_state text)
returns public.facilities
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
  fac public.facilities;
begin
  if length(trim(p_name)) < 3 or length(trim(p_lga)) < 2 or length(trim(p_state)) < 2 then
    raise exception 'Enter the facility name, LGA and state.';
  end if;
  update public.facilities
  set name = trim(p_name), lga = trim(p_lga), state = trim(p_state)
  where id = fid
  returning * into fac;
  return fac;
end;
$$;

-- 5. Lock the drawers: remove every temporary open policy
drop policy if exists "TEMP day3 read facilities" on public.facilities;
drop policy if exists "TEMP day3 anon patients" on public.patients;
drop policy if exists "TEMP day3 anon immunizations" on public.immunization_records;
drop policy if exists "TEMP day5 anon visits" on public.visits;
drop policy if exists "TEMP day11 anon guardians" on public.guardians;
drop policy if exists "TEMP day12 anon reminders" on public.reminders;

-- Not signed in = no access at all
revoke all on public.facilities, public.patients, public.immunization_records,
  public.visits, public.guardians, public.reminders from anon;

-- Signed-in members: only their own facility's rows
do $$
declare
  t text;
begin
  foreach t in array array['patients','immunization_records','visits','guardians','reminders'] loop
    execute format('drop policy if exists "members read" on public.%I', t);
    execute format('drop policy if exists "members insert" on public.%I', t);
    execute format('drop policy if exists "members update" on public.%I', t);

    execute format(
      'create policy "members read" on public.%I for select to authenticated
         using (facility_id in (select public.my_facility_ids()))', t);
    execute format(
      'create policy "members insert" on public.%I for insert to authenticated
         with check (facility_id in (select public.my_facility_ids()))', t);
    execute format(
      'create policy "members update" on public.%I for update to authenticated
         using (facility_id in (select public.my_facility_ids()))
         with check (facility_id in (select public.my_facility_ids()))', t);
  end loop;
end;
$$;
-- There is deliberately no DELETE policy: records are soft-deleted, never erased by the app.

alter table public.facilities enable row level security;
create policy "members read facility" on public.facilities for select to authenticated
  using (id in (select public.my_facility_ids()));

alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table public.memberships enable row level security;
create policy "read own membership" on public.memberships for select to authenticated
  using (user_id = (select auth.uid()));

alter table public.invites enable row level security; -- no policies: reachable only through the functions above

grant select on public.facilities to authenticated;
grant select, insert, update on public.patients, public.immunization_records,
  public.visits, public.guardians, public.reminders to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.memberships to authenticated;

-- Functions are open to everyone by default. Close them, then open only to signed-in users.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.my_facility_ids() from public, anon;
revoke execute on function public.max_staff(text) from public, anon;
revoke execute on function public.my_admin_facility() from public, anon;
revoke execute on function public.create_facility(text, text, text, text) from public, anon;
revoke execute on function public.create_invite(text) from public, anon;
revoke execute on function public.join_facility(text) from public, anon;
revoke execute on function public.list_invites() from public, anon;
revoke execute on function public.revoke_invite(text) from public, anon;
revoke execute on function public.list_members() from public, anon;
revoke execute on function public.remove_member(uuid) from public, anon;
revoke execute on function public.update_facility(text, text, text) from public, anon;

grant execute on function public.my_facility_ids() to authenticated;
grant execute on function public.max_staff(text) to authenticated;
grant execute on function public.my_admin_facility() to authenticated;
grant execute on function public.create_facility(text, text, text, text) to authenticated;
grant execute on function public.create_invite(text) to authenticated;
grant execute on function public.join_facility(text) to authenticated;
grant execute on function public.list_invites() to authenticated;
grant execute on function public.revoke_invite(text) to authenticated;
grant execute on function public.list_members() to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
grant execute on function public.update_facility(text, text, text) to authenticated;

-- 1. New columns
alter table public.patients
  add column notice_given_at timestamptz,
  add column notice_version text,
  add column erased_at timestamptz;
alter table public.visits add column erased_at timestamptz;

-- 2. Helpers
create or replace function public.is_admin_of(p_facility uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where user_id = (select auth.uid()) and facility_id = p_facility and role = 'admin'
  );
$$;

create or replace function public.user_in_facility(p_user uuid, p_facility uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.memberships where user_id = p_user and facility_id = p_facility);
$$;

-- 3. The audit log: members can add lines, only admins can read, nobody can change or delete
create table public.audit_log (
  id uuid primary key,
  facility_id uuid not null references public.facilities(id),
  actor_id uuid,
  actor_name text not null,
  action text not null,
  entity_type text,
  entity_id text,
  summary text not null default '',
  created_at timestamptz not null,
  received_at timestamptz not null default now(),
  sent_by uuid
);
create index audit_facility_time_idx on public.audit_log (facility_id, created_at desc);

-- The server writes down who REALLY sent each line, whatever the app claims
create or replace function public.audit_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.sent_by := (select auth.uid());
  new.received_at := now();
  return new;
end;
$$;
create trigger audit_log_stamp before insert on public.audit_log
  for each row execute function public.audit_stamp();

alter table public.audit_log enable row level security;
create policy "members add audit" on public.audit_log for insert to authenticated
  with check (
    facility_id in (select public.my_facility_ids())
    and actor_id is not null
    and public.user_in_facility(actor_id, facility_id)
  );
create policy "admins read audit" on public.audit_log for select to authenticated
  using (public.is_admin_of(facility_id));
grant select, insert on public.audit_log to authenticated;
-- No UPDATE or DELETE grant and no such policy: the log is append-only.

-- Server-side events (team changes, requests) are written by this internal function
create or replace function public.log_event(
  p_facility uuid, p_action text, p_entity_type text, p_entity_id text, p_summary text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (id, facility_id, actor_id, actor_name, action, entity_type, entity_id, summary, created_at)
  values (
    gen_random_uuid(), p_facility, (select auth.uid()),
    coalesce((select p.full_name from public.profiles p where p.id = (select auth.uid())), 'system'),
    p_action, p_entity_type, p_entity_id, p_summary, now()
  );
$$;

-- 4. Data requests (admins only)
create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id),
  patient_id uuid references public.patients(id),
  requester text not null,
  kind text not null check (kind in ('access','correction','erasure','stop_sms','other')),
  received_on date not null default current_date,
  status text not null default 'open' check (status in ('open','done','declined')),
  notes text not null default '',
  handled_by uuid references auth.users(id),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index data_requests_facility_idx on public.data_requests (facility_id, created_at desc);

alter table public.data_requests enable row level security;
create policy "admins manage requests" on public.data_requests for all to authenticated
  using (public.is_admin_of(facility_id)) with check (public.is_admin_of(facility_id));
grant select, insert, update on public.data_requests to authenticated;

-- 5. Team changes and requests write themselves into the log
create or replace function public.audit_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'memberships' then
    if tg_op = 'INSERT' then
      perform public.log_event(new.facility_id, 'team.join', 'user', new.user_id::text, new.role);
    else
      perform public.log_event(old.facility_id, 'team.remove', 'user', old.user_id::text, old.role);
    end if;
  elsif tg_table_name = 'invites' then
    -- the code is a secret, so only its first letters are recorded
    if tg_op = 'INSERT' then
      perform public.log_event(new.facility_id, 'team.invite', 'invite', left(new.code, 3) || '...', new.role);
    else
      perform public.log_event(old.facility_id, 'team.invite_cancelled', 'invite', left(old.code, 3) || '...', old.role);
    end if;
  elsif tg_table_name = 'facilities' then
    perform public.log_event(new.id, 'facility.update', 'facility', new.id::text, new.name);
  elsif tg_table_name = 'data_requests' then
    if tg_op = 'INSERT' then
      perform public.log_event(new.facility_id, 'request.create', 'request', new.id::text, new.kind);
    elsif new.status is distinct from old.status then
      perform public.log_event(new.facility_id, 'request.' || new.status, 'request', new.id::text, new.kind);
    end if;
  end if;
  return null;
end;
$$;

create trigger memberships_audit after insert or delete on public.memberships
  for each row execute function public.audit_events();
create trigger invites_audit after insert or delete on public.invites
  for each row execute function public.audit_events();
create trigger facilities_audit after update on public.facilities
  for each row execute function public.audit_events();
create trigger data_requests_audit after insert or update on public.data_requests
  for each row execute function public.audit_events();

-- 6. Only an admin may delete or merge a patient, and an erased patient stays erased
create or replace function public.guard_patient_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.erased_at is not null then
    return old; -- whatever a stale phone sends, an erased record is not brought back
  end if;
  if (select auth.uid()) is not null
     and ((new.deleted_at is not null and old.deleted_at is null)
          or (new.merged_into_id is not null and old.merged_into_id is null))
     and not public.is_admin_of(old.facility_id) then
    raise exception 'Only a facility admin can delete or merge a patient.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger patients_guard before update on public.patients
  for each row execute function public.guard_patient_changes();

-- 7. Permanent erasure: wipe identifying details everywhere, keep a marker so every phone receives it
create or replace function public.erase_patient(p_patient_id uuid, p_request_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
  pat public.patients;
begin
  select * into pat from public.patients where id = p_patient_id and facility_id = fid for update;
  if not found then
    raise exception 'That patient is not in your facility.';
  end if;
  if pat.erased_at is not null then
    return;
  end if;

  update public.visits set
    complaints = '[erased]', treatment = null, diagnosis_code = null, diagnosis_label = null,
    systolic = null, diastolic = null, temperature = null, weight_kg = null, next_due_date = null,
    deleted_at = coalesce(deleted_at, now()), erased_at = now(), updated_at = now()
  where patient_id = p_patient_id;

  update public.immunization_records set
    next_due_date = null, deleted_at = coalesce(deleted_at, now()), updated_at = now()
  where patient_id = p_patient_id;

  update public.reminders set
    status = case when status = 'sent' then status else 'cancelled' end,
    phone = '[erased]', message = '[erased]', updated_at = now()
  where patient_id = p_patient_id;

  update public.guardians set patient_id = null, updated_at = now() where patient_id = p_patient_id;

  update public.patients set
    full_name = '[erased]', name_key = 'erased', dob = date '1900-01-01', phone = null,
    village = '[erased]', village_key = 'erased',
    next_of_kin_name = '[erased]', next_of_kin_phone = '[erased]',
    nhis_number = null, blood_group = null, allergies = null, initial_chief_complaint = null,
    guardian_id = null, para = null, gravida = null, is_pregnant = false,
    sms_consent = false, sms_consent_at = null, notice_given_at = null, notice_version = null,
    deleted_at = coalesce(deleted_at, now()), erased_at = now(), updated_at = now()
  where id = p_patient_id;

  if p_request_id is not null then
    update public.data_requests
    set status = 'done', handled_by = (select auth.uid()), handled_at = now()
    where id = p_request_id and facility_id = fid;
  end if;

  perform public.log_event(fid, 'patient.erase', 'patient', p_patient_id::text, 'card ' || pat.card_number);
end;
$$;

-- 8. Who may call what
revoke execute on function public.audit_stamp() from public, anon, authenticated;
revoke execute on function public.log_event(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.audit_events() from public, anon, authenticated;
revoke execute on function public.guard_patient_changes() from public, anon, authenticated;
revoke execute on function public.is_admin_of(uuid) from public, anon;
revoke execute on function public.user_in_facility(uuid, uuid) from public, anon;
revoke execute on function public.erase_patient(uuid, uuid) from public, anon;

grant execute on function public.is_admin_of(uuid) to authenticated;
grant execute on function public.user_in_facility(uuid, uuid) to authenticated;
grant execute on function public.erase_patient(uuid, uuid) to authenticated;

-- 1. The patient cap, enforced by the database
create or replace function public.patient_limit(p_plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case p_plan when 'free' then 200 else null end;  -- null = unlimited
$$;

create or replace function public.enforce_patient_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fac_plan text;
  cap int;
  used int;
  was_active boolean;
begin
  if (select auth.uid()) is null then return new; end if;  -- dashboard and service tools
  if new.deleted_at is not null then return new; end if;   -- a deleted record takes no place

  -- Editing a patient that already counts is not new capacity (every upsert passes through here)
  if tg_op = 'UPDATE' then
    was_active := old.deleted_at is null;
  else
    was_active := exists (select 1 from public.patients where id = new.id and deleted_at is null);
  end if;
  if was_active then return new; end if;

  -- Lock the facility row so two phones cannot both take the last place
  select plan into fac_plan from public.facilities where id = new.facility_id for update;
  cap := public.patient_limit(fac_plan);
  if cap is null then return new; end if;

  select count(*) into used
  from public.patients
  where facility_id = new.facility_id and deleted_at is null;

  if used >= cap then
    raise exception 'The % plan holds % patients. Upgrade to add more.', fac_plan, cap
      using errcode = 'PR402';
  end if;
  return new;
end;
$$;

create trigger patients_limit before insert or update of deleted_at on public.patients
  for each row execute function public.enforce_patient_limit();

-- 2. Usage numbers for the Account page
create or replace function public.plan_usage()
returns table (plan text, patients int, patient_limit int, staff int, staff_limit int)
language sql
stable
security definer
set search_path = ''
as $$
  select f.plan,
         (select count(*)::int from public.patients p where p.facility_id = f.id and p.deleted_at is null),
         public.patient_limit(f.plan),
         (select count(*)::int from public.memberships m where m.facility_id = f.id),
         public.max_staff(f.plan)
  from public.facilities f
  where f.id in (select public.my_facility_ids());
$$;

-- 3. Scale: the pull query filters by facility then orders by synced_at, so index exactly that
create index if not exists patients_fac_synced_idx on public.patients (facility_id, synced_at);
create index if not exists visits_fac_synced_idx on public.visits (facility_id, synced_at);
create index if not exists immunizations_fac_synced_idx on public.immunization_records (facility_id, synced_at);
create index if not exists guardians_fac_synced_idx on public.guardians (facility_id, synced_at);
create index if not exists reminders_fac_synced_idx on public.reminders (facility_id, synced_at);

-- "Has anything changed?" in one cheap call
create or replace function public.facility_pulse()
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  fid uuid;
begin
  select id into fid from public.facilities where id in (select public.my_facility_ids()) limit 1;
  if fid is null then return null; end if;
  return greatest(
    (select max(synced_at) from public.patients where facility_id = fid),
    (select max(synced_at) from public.visits where facility_id = fid),
    (select max(synced_at) from public.immunization_records where facility_id = fid),
    (select max(synced_at) from public.guardians where facility_id = fid),
    (select max(synced_at) from public.reminders where facility_id = fid)
  );
end;
$$;

-- 4. Keep-alive: a real (tiny) database read that anyone may call
create or replace function public.keepalive()
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform 1 from public.facilities limit 1;
  return now();
end;
$$;

-- 5. Who may call what
revoke execute on function public.enforce_patient_limit() from public, anon, authenticated;
revoke execute on function public.plan_usage() from public, anon;
revoke execute on function public.facility_pulse() from public, anon;
revoke execute on function public.keepalive() from public;

grant execute on function public.plan_usage() to authenticated;
grant execute on function public.facility_pulse() to authenticated;
grant execute on function public.keepalive() to anon, authenticated;


-- ======================================================================
-- Day 19: an estimated birth date
-- ======================================================================
alter table public.patients add column if not exists dob_estimated boolean not null default false;


-- ======================================================================
-- Day 23: every phone reports how its sync is doing
-- ======================================================================
-- Day 23: every phone and tablet reports how its sync is doing, and a facility admin can see all of them.
-- No patient information is stored here: only counts, times, the app version and a device name.
-- Run this in the Supabase SQL Editor, and add it to supabase/schema.sql.

-- 1. One row per device. Nobody reads or writes this table directly: the functions below do it.
create table if not exists public.device_status (
  id uuid primary key,                                  -- the device's own random id, made on the device
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  user_name text,                                       -- who last used it
  label text,                                           -- a name an admin chose, such as "Front desk tablet"
  device_name text not null default '',                 -- what the device calls itself, such as "Android \u00b7 Chrome 129 \u00b7 7F3A"
  app_version text not null default '',
  waiting int not null default 0 check (waiting >= 0),  -- records on the device that are not uploaded yet
  failed int not null default 0 check (failed >= 0),    -- records on the device that need attention
  oldest_waiting_at timestamptz,                        -- device clock: when the oldest waiting record was saved
  last_sync_at timestamptz,                             -- device clock: its last successful sync
  pulse_seen timestamptz,                               -- the newest change in this facility that the device has downloaded
  battery int check (battery is null or battery between 0 and 100),
  charging boolean,
  power_saving boolean not null default false,
  device_time timestamptz,                              -- device clock at the moment of the report
  first_seen_at timestamptz not null default now(),
  seen_at timestamptz not null default now()            -- SERVER clock at the moment of the report
);
create index if not exists device_status_facility_idx on public.device_status (facility_id, seen_at desc);

alter table public.device_status enable row level security;
revoke all on public.device_status from anon, authenticated;
-- No policy and no grant on purpose: only the security definer functions below can touch the table.

-- 2. A device tells the cloud how it is doing. The facility and the person come from the sign-in, never from the app.
create or replace function public.report_device(
  p_device uuid,
  p_name text,
  p_app_version text,
  p_waiting int,
  p_failed int,
  p_oldest_waiting timestamptz,
  p_last_sync timestamptz,
  p_pulse_seen timestamptz,
  p_battery int,
  p_charging boolean,
  p_power_saving boolean,
  p_device_time timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
  who text;
begin
  select m.facility_id into fid from public.memberships m where m.user_id = (select auth.uid()) limit 1;
  if fid is null or p_device is null then return; end if;
  select p.full_name into who from public.profiles p where p.id = (select auth.uid());

  insert into public.device_status as d (
    id, facility_id, user_id, user_name, device_name, app_version, waiting, failed,
    oldest_waiting_at, last_sync_at, pulse_seen, battery, charging, power_saving, device_time
  )
  values (
    p_device, fid, (select auth.uid()), left(who, 80), left(coalesce(p_name, ''), 80), left(coalesce(p_app_version, ''), 40),
    greatest(coalesce(p_waiting, 0), 0), greatest(coalesce(p_failed, 0), 0),
    p_oldest_waiting, p_last_sync, p_pulse_seen,
    case when p_battery between 0 and 100 then p_battery end, p_charging, coalesce(p_power_saving, false), p_device_time
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    user_name = excluded.user_name,
    device_name = excluded.device_name,
    app_version = excluded.app_version,
    waiting = excluded.waiting,
    failed = excluded.failed,
    oldest_waiting_at = excluded.oldest_waiting_at,
    last_sync_at = coalesce(excluded.last_sync_at, d.last_sync_at),   -- a freshly opened app has not synced yet: keep the old value
    pulse_seen = coalesce(excluded.pulse_seen, d.pulse_seen),
    battery = excluded.battery,
    charging = excluded.charging,
    power_saving = excluded.power_saving,
    device_time = excluded.device_time,
    seen_at = now()
  where d.facility_id = excluded.facility_id;   -- a device id that belongs to another facility is never taken over
end;
$$;

-- 3. The admin's list, with how many newer records each device has not downloaded yet (counted, up to 500).
create or replace function public.list_devices()
returns table (
  id uuid,
  label text,
  device_name text,
  app_version text,
  user_name text,
  waiting int,
  failed int,
  oldest_waiting_at timestamptz,
  last_sync_at timestamptz,
  pulse_seen timestamptz,
  battery int,
  charging boolean,
  power_saving boolean,
  device_time timestamptz,
  first_seen_at timestamptz,
  seen_at timestamptz,
  facility_pulse timestamptz,
  server_now timestamptz,
  records_behind int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
  latest timestamptz := public.facility_pulse();
begin
  return query
    select
      d.id, d.label, d.device_name, d.app_version, d.user_name,
      d.waiting, d.failed, d.oldest_waiting_at, d.last_sync_at, d.pulse_seen,
      d.battery, d.charging, d.power_saving, d.device_time, d.first_seen_at, d.seen_at,
      latest, now(),
      least(500,
        (select count(*) from (select 1 from public.patients t where t.facility_id = fid and t.synced_at > coalesce(d.pulse_seen, 'epoch'::timestamptz) limit 500) a) +
        (select count(*) from (select 1 from public.visits t where t.facility_id = fid and t.synced_at > coalesce(d.pulse_seen, 'epoch'::timestamptz) limit 500) a) +
        (select count(*) from (select 1 from public.immunization_records t where t.facility_id = fid and t.synced_at > coalesce(d.pulse_seen, 'epoch'::timestamptz) limit 500) a) +
        (select count(*) from (select 1 from public.guardians t where t.facility_id = fid and t.synced_at > coalesce(d.pulse_seen, 'epoch'::timestamptz) limit 500) a) +
        (select count(*) from (select 1 from public.reminders t where t.facility_id = fid and t.synced_at > coalesce(d.pulse_seen, 'epoch'::timestamptz) limit 500) a)
      )::int
    from public.device_status d
    where d.facility_id = fid
    order by d.seen_at desc;
end;
$$;

-- 4. An admin names a device, or clears the name (an empty text puts the automatic name back)
create or replace function public.rename_device(p_id uuid, p_label text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
begin
  update public.device_status
  set label = nullif(left(trim(coalesce(p_label, '')), 60), '')
  where id = p_id and facility_id = fid;
  if not found then
    raise exception 'That device is not on your list.';
  end if;
end;
$$;

-- 5. An admin takes a device off the list (an old phone, a lost tablet). If it is used again it appears again.
create or replace function public.remove_device(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
begin
  delete from public.device_status where id = p_id and facility_id = fid;
  if not found then
    raise exception 'That device is not on your list.';
  end if;
end;
$$;

revoke all on function public.report_device(uuid, text, text, int, int, timestamptz, timestamptz, timestamptz, int, boolean, boolean, timestamptz) from public, anon;
revoke all on function public.list_devices() from public, anon;
revoke all on function public.rename_device(uuid, text) from public, anon;
revoke all on function public.remove_device(uuid) from public, anon;
grant execute on function public.report_device(uuid, text, text, int, int, timestamptz, timestamptz, timestamptz, int, boolean, boolean, timestamptz) to authenticated;
grant execute on function public.list_devices() to authenticated;
grant execute on function public.rename_device(uuid, text) to authenticated;
grant execute on function public.remove_device(uuid) to authenticated;

-- Tell the API to notice the new functions straight away
notify pgrst, 'reload schema';


-- ======================================================================
-- Day 24: phone to phone sync keys, and the cloud ignores stale writes
-- ======================================================================
-- Day 24: phones can sync with each other over the clinic Wi-Fi, and the cloud protects newer records.
-- Run this in the Supabase SQL Editor, and add it to supabase/schema.sql.

-- PART 1. The clinic key: a secret every signed-in phone of one facility holds.
-- Two phones prove to each other that they hold it before they swap any records.
-- It is never sent between phones. It changes by itself whenever someone is removed from the team.

create table if not exists public.facility_secrets (
  facility_id uuid primary key references public.facilities(id) on delete cascade,
  sync_key text not null,
  key_version int not null default 1,
  rotated_at timestamptz not null default now()
);
alter table public.facility_secrets enable row level security;
revoke all on public.facility_secrets from anon, authenticated;
-- No policy and no grant on purpose: only the functions below can touch the table.

-- 32 random bytes as text. Two random ids and the clock are mixed and hashed, so nothing extra has to be installed.
create or replace function public.new_sync_key()
returns text
language sql
volatile
set search_path = ''
as $$
  select encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text, 'UTF8')), 'base64');
$$;

-- Any signed-in member gets the key for their own facility. The first call makes it.
create or replace function public.get_sync_key()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
  result json;
begin
  select m.facility_id into fid from public.memberships m where m.user_id = (select auth.uid()) limit 1;
  if fid is null then
    raise exception 'You are not part of a facility.';
  end if;
  insert into public.facility_secrets (facility_id, sync_key) values (fid, public.new_sync_key()) on conflict (facility_id) do nothing;
  select json_build_object('key', s.sync_key, 'version', s.key_version) into result from public.facility_secrets s where s.facility_id = fid;
  return result;
end;
$$;

-- An admin can change the key at any time. Phones that still hold the old one must go online once to get the new one.
create or replace function public.rotate_sync_key()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid := public.my_admin_facility();
begin
  insert into public.facility_secrets (facility_id, sync_key) values (fid, public.new_sync_key())
  on conflict (facility_id) do update set sync_key = public.new_sync_key(), key_version = public.facility_secrets.key_version + 1, rotated_at = now();
  perform public.log_event(fid, 'sync.key.rotate', 'facility', fid::text, 'The clinic sync key was changed');
end;
$$;

-- Removing someone from the team changes the key by itself, so their phone can no longer join a sync
create or replace function public.rotate_key_on_member_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.facility_secrets
  set sync_key = public.new_sync_key(), key_version = key_version + 1, rotated_at = now()
  where facility_id = old.facility_id;
  return old;
end;
$$;
drop trigger if exists memberships_rotate_key on public.memberships;
create trigger memberships_rotate_key after delete on public.memberships
  for each row execute function public.rotate_key_on_member_removal();

revoke all on function public.new_sync_key() from public, anon, authenticated;
revoke all on function public.rotate_key_on_member_removal() from public, anon, authenticated;
revoke all on function public.get_sync_key() from public, anon;
revoke all on function public.rotate_sync_key() from public, anon;
grant execute on function public.get_sync_key() to authenticated;
grant execute on function public.rotate_sync_key() to authenticated;

-- PART 2. An older copy of a record never replaces a newer one.
-- Until now, a phone that was offline for a day and then uploaded its old edit would overwrite what a colleague
-- saved in between. With phones passing records to each other, old copies travel more, so the cloud now refuses them.
-- Equal times are accepted (the same record sent twice). A permanent erasure is always accepted.

create or replace function public.ignore_stale_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return null; -- skip this one update: the record in the cloud is newer
  end if;
  return new;
end;
$$;

-- Patients and visits can be erased, and an erasure must never be skipped, even if a phone's clock ran ahead
create or replace function public.ignore_stale_write_erasable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.erased_at is null and new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

-- The names start with "00" so they run before the other triggers on these tables (they run in alphabetical order)
drop trigger if exists patients_00_stale on public.patients;
create trigger patients_00_stale before update on public.patients for each row execute function public.ignore_stale_write_erasable();
drop trigger if exists visits_00_stale on public.visits;
create trigger visits_00_stale before update on public.visits for each row execute function public.ignore_stale_write_erasable();
drop trigger if exists immunization_records_00_stale on public.immunization_records;
create trigger immunization_records_00_stale before update on public.immunization_records for each row execute function public.ignore_stale_write();
drop trigger if exists guardians_00_stale on public.guardians;
create trigger guardians_00_stale before update on public.guardians for each row execute function public.ignore_stale_write();
drop trigger if exists reminders_00_stale on public.reminders;
create trigger reminders_00_stale before update on public.reminders for each row execute function public.ignore_stale_write();

revoke all on function public.ignore_stale_write() from public, anon, authenticated;
revoke all on function public.ignore_stale_write_erasable() from public, anon, authenticated;

notify pgrst, 'reload schema';


-- ======================================================================
-- Day 26: payments with Paystack, subscriptions and annual plans
-- ======================================================================
-- Day 26: payments with Paystack (test mode first), subscriptions and annual plans.
-- Run this in the Supabase SQL Editor, and add it to supabase/schema.sql.
--
-- The rule behind everything here: a phone can never change a plan. Only the payment functions below can, and only
-- the server (the "service_role" used by the Edge Functions) may call them. They are safe to repeat: the same payment
-- reported twice changes nothing the second time.

/* ---------- the price list: the only place an amount comes from ---------- */

create table if not exists public.billing_plans (
  code text primary key, -- basic_monthly, basic_annual, pro_monthly, pro_annual
  plan text not null check (plan in ('basic', 'pro')),
  cycle text not null check (cycle in ('monthly', 'annual')),
  amount_kobo int not null check (amount_kobo > 0), -- Paystack counts in kobo: 100 kobo = 1 naira
  paystack_plan_code text unique, -- PLN_..., filled in after the plans exist in Paystack (needed for automatic renewal)
  unique (plan, cycle)
);
alter table public.billing_plans enable row level security;
drop policy if exists "anyone signed in reads prices" on public.billing_plans;
create policy "anyone signed in reads prices" on public.billing_plans for select to authenticated using (true);
revoke all on public.billing_plans from anon, authenticated;
grant select on public.billing_plans to authenticated;

-- 2,500 and 5,000 naira a month; a year costs ten months (two months free)
insert into public.billing_plans (code, plan, cycle, amount_kobo) values
  ('basic_monthly', 'basic', 'monthly', 250000),
  ('basic_annual', 'basic', 'annual', 2500000),
  ('pro_monthly', 'pro', 'monthly', 500000),
  ('pro_annual', 'pro', 'annual', 5000000)
on conflict (code) do nothing;

/* ---------- what happened ---------- */

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique, -- one payment, one reference: this is what makes repeats harmless
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  billing_plan text not null references public.billing_plans(code),
  mode text not null check (mode in ('once', 'subscribe', 'renewal')),
  amount_kobo int not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  paystack_id bigint,
  paid_at timestamptz,
  applied_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists payments_facility_idx on public.payments (facility_id, created_at desc);
alter table public.payments enable row level security;
drop policy if exists "admins read their payments" on public.payments;
create policy "admins read their payments" on public.payments for select to authenticated using (public.is_admin_of(facility_id));
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- Where a facility stands: paid until when, and how it renews. Nobody reads this table directly (it holds a secret).
create table if not exists public.facility_billing (
  facility_id uuid primary key references public.facilities(id) on delete cascade,
  billing_plan text references public.billing_plans(code), -- what the current period was bought as (empty for a pilot)
  source text not null default 'paid' check (source in ('paid', 'pilot')),
  plan_until timestamptz not null,
  status text not null default 'active' check (status in ('active', 'past_due', 'cancelling', 'expired')),
  auto_renew boolean not null default false,
  paystack_subscription_code text,
  paystack_email_token text, -- a secret: Paystack asks for it to cancel a subscription. It never leaves the server.
  last_payment_at timestamptz,
  pilot_started_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.facility_billing enable row level security;
revoke all on public.facility_billing from anon, authenticated;

-- A Paystack customer belongs to one facility, so a renewal Paystack makes by itself can be matched
create table if not exists public.billing_customers (
  customer_code text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.billing_customers enable row level security;
revoke all on public.billing_customers from anon, authenticated;

/* ---------- small helpers ---------- */

create or replace function public.plan_rank(p text) returns int language sql immutable set search_path = '' as $$
  select case p when 'pro' then 2 when 'basic' then 1 else 0 end;
$$;
create or replace function public.billing_grace_days() returns int language sql immutable set search_path = '' as $$ select 7; $$;
create or replace function public.cycle_interval(c text) returns interval language sql immutable set search_path = '' as $$
  select case c when 'annual' then interval '1 year' else interval '1 month' end;
$$;
create or replace function public.cycle_days(c text) returns int language sql immutable set search_path = '' as $$
  select case c when 'annual' then 365 else 30 end;
$$;

-- After the paid time (plus a week of patience) runs out, the facility goes back to Free. Patients and records stay:
-- the Free plan only stops new patients beyond its limit, which the app already handles calmly.
create or replace function public.expire_one(p_facility uuid, p_now timestamptz default now())
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.facility_billing;
begin
  select * into b from public.facility_billing where facility_id = p_facility for update;
  if b.facility_id is null or b.status = 'expired' then return false; end if;
  if b.plan_until + make_interval(days => public.billing_grace_days()) >= p_now then return false; end if;
  update public.facilities set plan = 'free' where id = p_facility;
  update public.facility_billing set status = 'expired', auto_renew = false, updated_at = p_now where facility_id = p_facility;
  perform public.log_event(p_facility, 'billing.expired', 'facility', p_facility::text, 'The paid plan ended and the facility returned to Free');
  return true;
end;
$$;

create or replace function public.expire_plans(p_now timestamptz default now())
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  n int := 0;
begin
  for r in select facility_id from public.facility_billing where status <> 'expired' and plan_until + make_interval(days => public.billing_grace_days()) < p_now loop
    if public.expire_one(r.facility_id, p_now) then n := n + 1; end if;
  end loop;
  return n;
end;
$$;

-- The one place that adds time. A same plan adds to the end of the current period. A higher plan starts today and turns
-- the unused part of the old paid period into extra days. A lower plan is never applied over a higher one.
create or replace function public.extend_billing(p_facility uuid, p_code text, p_auto boolean, p_now timestamptz)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  bp public.billing_plans;
  oldbp public.billing_plans;
  cur public.facility_billing;
  curplan text;
  base timestamptz := p_now;
  bonus int := 0;
  remaining numeric;
  new_until timestamptz;
begin
  select * into bp from public.billing_plans where code = p_code;
  select * into cur from public.facility_billing where facility_id = p_facility for update;
  select f.plan into curplan from public.facilities f where f.id = p_facility;
  -- Still inside the paid time, or inside the week of patience after it: the new time continues from where the old ended
  if cur.facility_id is not null and cur.status <> 'expired' and p_now <= cur.plan_until + make_interval(days => public.billing_grace_days()) then
    if cur.plan_until > p_now and public.plan_rank(bp.plan) < public.plan_rank(curplan) then
      return json_build_object('applied', false, 'reason', 'lower_plan');
    elsif bp.plan = curplan then
      base := cur.plan_until;
    elsif cur.plan_until > p_now and cur.source = 'paid' and cur.billing_plan is not null then
      select * into oldbp from public.billing_plans where code = cur.billing_plan;
      remaining := ceil(extract(epoch from (cur.plan_until - p_now)) / 86400);
      bonus := least(400, floor(remaining * (oldbp.amount_kobo::numeric / public.cycle_days(oldbp.cycle)) / (bp.amount_kobo::numeric / public.cycle_days(bp.cycle))))::int;
    end if;
  end if;
  new_until := base + public.cycle_interval(bp.cycle) + make_interval(days => bonus);
  update public.facilities set plan = bp.plan where id = p_facility;
  insert into public.facility_billing (facility_id, billing_plan, source, plan_until, status, auto_renew, last_payment_at, updated_at)
  values (p_facility, bp.code, 'paid', new_until, 'active', p_auto, p_now, p_now)
  on conflict (facility_id) do update set
    billing_plan = excluded.billing_plan, source = 'paid', plan_until = excluded.plan_until, status = 'active',
    auto_renew = excluded.auto_renew or public.facility_billing.auto_renew, -- paying once does not switch an existing subscription off
    last_payment_at = excluded.last_payment_at, updated_at = excluded.updated_at;
  perform public.log_event(p_facility, 'billing.paid', 'facility', p_facility::text, 'Payment received for ' || bp.plan || ' (' || bp.cycle || '), paid until ' || to_char(new_until, 'YYYY-MM-DD'));
  return json_build_object('applied', true, 'plan', bp.plan, 'until', new_until, 'bonusDays', bonus, 'from', base);
end;
$$;

/* ---------- what the app may ask (signed in members) ---------- */

create or replace function public.get_billing()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
  f public.facilities;
  b public.facility_billing;
  admin boolean;
begin
  select m.facility_id into fid from public.memberships m where m.user_id = (select auth.uid()) limit 1;
  if fid is null then raise exception 'You are not part of a facility.'; end if;
  perform public.expire_one(fid);
  select * into f from public.facilities where id = fid;
  select * into b from public.facility_billing where facility_id = fid;
  admin := public.is_admin_of(fid);
  return json_build_object(
    'plan', f.plan,
    'isAdmin', admin,
    'status', coalesce(b.status, 'none'),
    'source', b.source,
    'until', b.plan_until,
    'graceUntil', case when b.plan_until is null then null else b.plan_until + make_interval(days => public.billing_grace_days()) end,
    'autoRenew', coalesce(b.auto_renew, false),
    'billingPlan', b.billing_plan,
    'plans', (select coalesce(json_agg(json_build_object('code', p.code, 'plan', p.plan, 'cycle', p.cycle, 'amountKobo', p.amount_kobo, 'canSubscribe', p.paystack_plan_code is not null) order by p.amount_kobo), '[]'::json) from public.billing_plans p),
    'payments', case when admin then (select coalesce(json_agg(x order by x.at desc), '[]'::json) from (
        select p.created_at as at, p.reference, p.billing_plan as code, p.amount_kobo as "amountKobo", p.status, p.mode, p.period_end as "periodEnd"
        from public.payments p where p.facility_id = fid order by p.created_at desc limit 10) x) else '[]'::json end
  );
end;
$$;

/* ---------- what only the server may do (the Edge Functions use the service role) ---------- */

-- Step 1 of a payment: who is paying, for what, and what it costs. Nothing is charged yet.
create or replace function public.begin_payment(p_user uuid, p_code text, p_mode text, p_reference text, p_now timestamptz default now())
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
  bp public.billing_plans;
  curplan text;
  b public.facility_billing;
  fname text;
begin
  select m.facility_id into fid from public.memberships m where m.user_id = p_user and m.role = 'admin' limit 1;
  if fid is null then raise exception 'billing:not_admin' using errcode = '42501'; end if;
  select * into bp from public.billing_plans where code = p_code;
  if bp.code is null or p_mode not in ('once', 'subscribe') then raise exception 'billing:bad_plan'; end if;
  if p_mode = 'subscribe' and bp.paystack_plan_code is null then raise exception 'billing:no_autorenew'; end if;
  perform public.expire_one(fid, p_now);
  select * into b from public.facility_billing where facility_id = fid;
  select f.plan, f.name into curplan, fname from public.facilities f where f.id = fid;
  if b.facility_id is not null and b.status <> 'expired' and b.plan_until > p_now and public.plan_rank(bp.plan) < public.plan_rank(curplan) then
    raise exception 'billing:lower_plan';
  end if;
  insert into public.payments (reference, facility_id, user_id, billing_plan, mode, amount_kobo) values (p_reference, fid, p_user, bp.code, p_mode, bp.amount_kobo);
  return json_build_object('facilityId', fid, 'facilityName', fname, 'amountKobo', bp.amount_kobo,
    'paystackPlanCode', case when p_mode = 'subscribe' then bp.paystack_plan_code else null end,
    'email', (select u.email from auth.users u where u.id = p_user));
end;
$$;

-- Step 2: Paystack has confirmed (to the server, not to the phone) that this reference was paid. Check it against what we
-- expected, then give the time. A reference that was already applied changes nothing.
create or replace function public.apply_payment(
  p_reference text, p_amount_kobo int, p_currency text, p_paystack_id bigint, p_paid_at timestamptz,
  p_customer_code text, p_plan_code text, p_now timestamptz default now()
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments;
  bp public.billing_plans;
  r json;
begin
  select * into pay from public.payments where reference = p_reference for update;
  if pay.id is null then return json_build_object('ok', false, 'reason', 'unknown_reference'); end if;
  if pay.status = 'success' then return json_build_object('ok', true, 'already', true); end if;
  if pay.status = 'failed' then return json_build_object('ok', false, 'reason', 'failed_before'); end if; -- a refused payment stays refused
  select * into bp from public.billing_plans where code = pay.billing_plan;
  if upper(coalesce(p_currency, '')) <> 'NGN' then
    update public.payments set status = 'failed', note = 'wrong currency' where id = pay.id;
    return json_build_object('ok', false, 'reason', 'currency');
  end if;
  if p_amount_kobo is distinct from pay.amount_kobo then
    update public.payments set status = 'failed', note = 'amount was ' || coalesce(p_amount_kobo::text, 'missing') || ', expected ' || pay.amount_kobo where id = pay.id;
    return json_build_object('ok', false, 'reason', 'amount');
  end if;
  if pay.mode = 'subscribe' and p_plan_code is not null and p_plan_code <> '' and p_plan_code is distinct from bp.paystack_plan_code then -- wrong plan: refused. Not reported: the amount, currency and reference above already match
    update public.payments set status = 'failed', note = 'wrong Paystack plan' where id = pay.id;
    return json_build_object('ok', false, 'reason', 'plan');
  end if;
  r := public.extend_billing(pay.facility_id, bp.code, pay.mode = 'subscribe', p_now);
  if p_customer_code is not null and p_customer_code <> '' then
    insert into public.billing_customers (customer_code, facility_id) values (p_customer_code, pay.facility_id)
    on conflict (customer_code) do update set facility_id = excluded.facility_id;
  end if;
  update public.payments set status = 'success', paystack_id = p_paystack_id, paid_at = coalesce(p_paid_at, p_now), applied_at = p_now,
    period_start = case when (r->>'applied')::boolean then (r->>'from')::timestamptz end,
    period_end = case when (r->>'applied')::boolean then (r->>'until')::timestamptz end,
    note = case when (r->>'applied')::boolean then null else 'paid, but a higher plan was active: not applied, refund by hand' end
  where id = pay.id;
  return json_build_object('ok', true, 'applied', (r->>'applied')::boolean, 'plan', r->>'plan', 'until', r->>'until', 'bonusDays', r->>'bonusDays');
end;
$$;

-- A subscription renews by itself: Paystack charges the card and tells us. There is no pending row, so it is matched by
-- the customer, and the amount must equal the price of the Paystack plan that was charged.
create or replace function public.apply_renewal(
  p_customer_code text, p_plan_code text, p_reference text, p_amount_kobo int, p_currency text,
  p_paystack_id bigint, p_paid_at timestamptz, p_now timestamptz default now()
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
  bp public.billing_plans;
  r json;
  inserted int;
begin
  select c.facility_id into fid from public.billing_customers c where c.customer_code = p_customer_code;
  if fid is null then return json_build_object('ok', false, 'reason', 'unknown_customer'); end if;
  select * into bp from public.billing_plans where paystack_plan_code = p_plan_code;
  if bp.code is null then return json_build_object('ok', false, 'reason', 'unknown_plan'); end if;
  if upper(coalesce(p_currency, '')) <> 'NGN' then return json_build_object('ok', false, 'reason', 'currency'); end if;
  if p_amount_kobo is distinct from bp.amount_kobo then return json_build_object('ok', false, 'reason', 'amount'); end if;
  insert into public.payments (reference, facility_id, billing_plan, mode, amount_kobo, status, paystack_id, paid_at, applied_at)
  values (p_reference, fid, bp.code, 'renewal', bp.amount_kobo, 'pending', p_paystack_id, coalesce(p_paid_at, p_now), p_now)
  on conflict (reference) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return json_build_object('ok', true, 'already', true); end if;
  r := public.extend_billing(fid, bp.code, true, p_now);
  update public.payments set status = 'success',
    period_start = case when (r->>'applied')::boolean then (r->>'from')::timestamptz end,
    period_end = case when (r->>'applied')::boolean then (r->>'until')::timestamptz end,
    note = case when (r->>'applied')::boolean then null else 'paid, but a higher plan was active: not applied, refund by hand' end
  where reference = p_reference;
  return json_build_object('ok', true, 'applied', (r->>'applied')::boolean, 'until', r->>'until');
end;
$$;

-- Paystack says a subscription now exists: remember its code and token, so it can be cancelled later
create or replace function public.note_subscription(p_customer_code text, p_subscription_code text, p_email_token text, p_now timestamptz default now())
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
begin
  select c.facility_id into fid from public.billing_customers c where c.customer_code = p_customer_code;
  if fid is null or not exists (select 1 from public.facility_billing where facility_id = fid) then
    return json_build_object('ok', false, 'reason', 'unknown_customer'); -- usually this arrived before the payment did: Paystack will send it again
  end if;
  update public.facility_billing set paystack_subscription_code = p_subscription_code, paystack_email_token = p_email_token,
    auto_renew = true, status = case when status = 'cancelling' then 'cancelling' else 'active' end, updated_at = p_now
  where facility_id = fid;
  return json_build_object('ok', true);
end;
$$;

-- A renewal payment failed: the facility keeps its plan for the week of patience, and the app says so
create or replace function public.mark_past_due(p_customer_code text, p_now timestamptz default now())
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
begin
  select c.facility_id into fid from public.billing_customers c where c.customer_code = p_customer_code;
  if fid is null then return json_build_object('ok', false, 'reason', 'unknown_customer'); end if;
  update public.facility_billing set status = 'past_due', updated_at = p_now where facility_id = fid and status = 'active';
  perform public.log_event(fid, 'billing.past_due', 'facility', fid::text, 'A subscription payment failed');
  return json_build_object('ok', true);
end;
$$;

-- The subscription will not renew (cancelled by the admin, or by Paystack): the paid time still runs to its end
create or replace function public.mark_cancelling(p_subscription_code text, p_now timestamptz default now())
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
begin
  select b.facility_id into fid from public.facility_billing b where b.paystack_subscription_code = p_subscription_code;
  if fid is null then return json_build_object('ok', false, 'reason', 'unknown_subscription'); end if;
  update public.facility_billing set auto_renew = false, status = case when status = 'expired' then 'expired' else 'cancelling' end, updated_at = p_now where facility_id = fid;
  perform public.log_event(fid, 'billing.cancelling', 'facility', fid::text, 'Automatic renewal was turned off');
  return json_build_object('ok', true);
end;
$$;

-- For cancelling: which subscription does this admin's facility have?
create or replace function public.get_cancel_target(p_user uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
  b public.facility_billing;
begin
  select m.facility_id into fid from public.memberships m where m.user_id = p_user and m.role = 'admin' limit 1;
  if fid is null then raise exception 'billing:not_admin' using errcode = '42501'; end if;
  select * into b from public.facility_billing where facility_id = fid;
  if b.facility_id is null or b.paystack_subscription_code is null or not b.auto_renew then raise exception 'billing:no_subscription'; end if;
  return json_build_object('code', b.paystack_subscription_code, 'token', b.paystack_email_token);
end;
$$;

-- The pilot offer: Pro free for three months, for the first five clinics. Run it yourself, by hand, for each clinic.
create or replace function public.grant_pilot(p_facility uuid, p_months int default 3, p_now timestamptz default now())
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.facilities where id = p_facility) then return json_build_object('ok', false, 'reason', 'unknown_facility'); end if;
  if (select count(*) from public.facility_billing where pilot_started_at is not null and facility_id <> p_facility) >= 5 then
    return json_build_object('ok', false, 'reason', 'pilot_full');
  end if;
  update public.facilities set plan = 'pro' where id = p_facility;
  insert into public.facility_billing (facility_id, billing_plan, source, plan_until, status, auto_renew, pilot_started_at, updated_at)
  values (p_facility, null, 'pilot', p_now + make_interval(months => p_months), 'active', false, p_now, p_now)
  on conflict (facility_id) do update set billing_plan = null, source = 'pilot', plan_until = excluded.plan_until, status = 'active', auto_renew = false,
    pilot_started_at = coalesce(public.facility_billing.pilot_started_at, p_now), updated_at = p_now;
  perform public.log_event(p_facility, 'billing.pilot', 'facility', p_facility::text, 'Pilot offer: Pro free for ' || p_months || ' months');
  return json_build_object('ok', true, 'until', p_now + make_interval(months => p_months));
end;
$$;

/* ---------- who may call what ---------- */

revoke all on function public.plan_rank(text), public.billing_grace_days(), public.cycle_interval(text), public.cycle_days(text) from public, anon, authenticated;
revoke all on function public.expire_one(uuid, timestamptz), public.expire_plans(timestamptz), public.extend_billing(uuid, text, boolean, timestamptz) from public, anon, authenticated;
revoke all on function public.begin_payment(uuid, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.apply_payment(text, int, text, bigint, timestamptz, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.apply_renewal(text, text, text, int, text, bigint, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.note_subscription(text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.mark_past_due(text, timestamptz), public.mark_cancelling(text, timestamptz) from public, anon, authenticated;
revoke all on function public.get_cancel_target(uuid), public.grant_pilot(uuid, int, timestamptz) from public, anon, authenticated;
revoke all on function public.get_billing() from public, anon;

grant execute on function public.get_billing() to authenticated;
grant execute on function public.plan_rank(text), public.billing_grace_days(), public.cycle_interval(text), public.cycle_days(text) to service_role;
grant execute on function public.expire_one(uuid, timestamptz), public.expire_plans(timestamptz), public.extend_billing(uuid, text, boolean, timestamptz) to service_role;
grant execute on function public.begin_payment(uuid, text, text, text, timestamptz) to service_role;
grant execute on function public.apply_payment(text, int, text, bigint, timestamptz, text, text, timestamptz) to service_role;
grant execute on function public.apply_renewal(text, text, text, int, text, bigint, timestamptz, timestamptz) to service_role;
grant execute on function public.note_subscription(text, text, text, timestamptz) to service_role;
grant execute on function public.mark_past_due(text, timestamptz), public.mark_cancelling(text, timestamptz) to service_role;
grant execute on function public.get_cancel_target(uuid), public.grant_pilot(uuid, int, timestamptz) to service_role;

-- OPTIONAL: end paid plans by themselves every day, even when nobody opens the app. Needs the pg_cron extension
-- (Supabase: Database > Extensions > pg_cron). Without it, a plan still ends the next time anyone opens the plans page.
-- select cron.schedule('prima-expire-plans', '15 3 * * *', $$select public.expire_plans()$$);

notify pgrst, 'reload schema';


-- ======================================================================
-- Day 27: a record that each person accepted the notices
-- ======================================================================
-- Day 27: a record that each person accepted the intended-use statement and the confidentiality statement.
-- Run in the Supabase SQL Editor. Safe to run twice. It adds one table and two functions and changes nothing that exists.

create table if not exists public.notice_acceptances (
  user_id uuid not null references auth.users (id) on delete cascade,
  facility_id uuid not null references public.facilities (id) on delete cascade,
  kind text not null check (kind in ('intended_use', 'confidentiality')),
  version text not null check (version ~ '^[0-9]{1,3}$'), -- the wording is versioned: a new version asks everyone again
  language text check (language is null or language ~ '^[a-z]{2}$'), -- the language the app was in when they accepted
  accepted_at timestamptz not null default now(),
  primary key (user_id, kind, version)
);

alter table public.notice_acceptances enable row level security;
revoke all on public.notice_acceptances from anon, authenticated;
grant select on public.notice_acceptances to authenticated;

-- A person reads their own acceptances. A facility admin reads everyone's in that facility (the evidence for the data protection gate).
drop policy if exists "read own or admin" on public.notice_acceptances;
create policy "read own or admin" on public.notice_acceptances for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin_of(facility_id));
-- There is no insert, update or delete policy and no such grant: only accept_notice() below can add a row, and nothing can change one.

create or replace function public.accept_notice(p_kind text, p_version text, p_language text default null)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  fid uuid;
begin
  if uid is null then raise exception 'notice:signin'; end if;
  if p_kind is null or p_kind not in ('intended_use', 'confidentiality') then raise exception 'notice:kind'; end if;
  if p_version is null or p_version !~ '^[0-9]{1,3}$' then raise exception 'notice:version'; end if;
  select m.facility_id into fid from public.memberships m where m.user_id = uid limit 1;
  if fid is null then raise exception 'notice:no_facility'; end if;
  insert into public.notice_acceptances (user_id, facility_id, kind, version, language)
  values (uid, fid, p_kind, p_version, case when p_language ~ '^[a-z]{2}$' then p_language end)
  on conflict (user_id, kind, version) do nothing; -- accepting twice (a retry, a second phone) is harmless and keeps the first time
  return json_build_object('ok', true);
end;
$$;

-- What this person has already accepted, so a second phone does not ask again
create or replace function public.my_notices()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object('kind', n.kind, 'version', n.version, 'at', n.accepted_at) order by n.accepted_at), '[]'::json)
  from public.notice_acceptances n
  where n.user_id = (select auth.uid());
$$;

revoke all on function public.accept_notice(text, text, text) from public, anon;
revoke all on function public.my_notices() from public, anon;
grant execute on function public.accept_notice(text, text, text) to authenticated;
grant execute on function public.my_notices() to authenticated;


-- ======================================================================
-- Day 27b: the real time from the server (the phone's clock warning)
-- ======================================================================
-- Day 27: the real time, from the server, so a phone can find out whether its own clock is wrong.
-- Run in the Supabase SQL Editor. Safe to run twice. It adds one function and changes nothing that exists.
create or replace function public.server_time()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select now();
$$;

revoke all on function public.server_time() from public, anon;
grant execute on function public.server_time() to authenticated;
