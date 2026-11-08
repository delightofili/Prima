-- Closes the doors a fresh Supabase project leaves open. Run it AFTER every table exists (after schema.sql and the day files),
-- on every project. Safe to run twice. Row-level security still guards the rows; this removes the rights themselves.

-- 1. A signed-out visitor (anon) has no right to any table
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- 2. The audit log can only be added to: nobody signed in can change or delete the history
revoke update, delete, truncate on public.audit_log from authenticated, anon;

-- 3. A signed-in person cannot change the clinic's plan themselves: only the server does, after a payment is verified
revoke update on public.facilities from authenticated, anon;