-- Day 30: take away rights that nobody needs.
-- Run it on BOTH databases (test first, then production), one after the other, then run gate.sql on each.
-- It only removes rights, so it is safe to run twice. Save it in supabase/ the same day (the Day 28 lesson).

-- 1. TRUNCATE empties a whole table in one command, and row level security does not apply to it.
--    A signed in person must never be able to do that to the patient table (or to anyone else's clinic).
--    REFERENCES and TRIGGER let a person attach their own rules to your tables. Nobody signed in needs them either.
--    They keep select, insert, update and delete, which are limited to their own clinic by row level security.
revoke truncate, references, trigger on all tables in schema public from authenticated, anon;

-- ...and the same for every table made from now on, so a new table does not bring the rights back
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated, anon;

-- 2. Three helper functions were open to everyone, but nobody calls them directly:
--    keep_sent_final and touch_synced_at are only run by triggers (a trigger does not need the right to run its function),
--    patient_limit is only called inside two functions that run as their owner (enforce_patient_limit and plan_usage).
revoke execute on function public.keep_sent_final() from public, anon, authenticated;
revoke execute on function public.touch_synced_at() from public, anon, authenticated;
revoke execute on function public.patient_limit(text) from public, anon, authenticated;