-- 003: Fix permission denied for authenticated / service_role
-- Root cause: 001 & 002 created tables + RLS but never GRANTed privileges.
-- PostgREST (Supabase REST API) checks GRANTs before RLS, so even with correct
-- auth.uid() the request fails with 42501 "permission denied for table ...".
-- This migration grants the minimal required privileges. RLS policies still
-- enforce row-level ownership.

-- 1) Schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2) Tables: user_devices (core bug for POST /api/devices)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_devices TO authenticated, service_role;
GRANT SELECT ON TABLE public.user_devices TO anon; -- anon never inserts, but allow read via RLS if needed

-- 3) users (profile)
GRANT SELECT, UPDATE ON TABLE public.users TO authenticated, service_role;
GRANT SELECT ON TABLE public.users TO anon;

-- 4) newsletters (public insert)
GRANT SELECT, INSERT ON TABLE public.newsletters TO anon, authenticated, service_role;

-- 5) rules + device_rules (app layer uses these for automation)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rules TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.device_rules TO authenticated, service_role;

-- 6) logs (append-only, but service_role writes via webhook, authenticated reads own)
GRANT SELECT ON TABLE public.logs TO authenticated, service_role;
GRANT INSERT ON TABLE public.logs TO service_role;
-- authenticated insert is intentionally NOT granted (logs go via webhook service_role only)

-- 7) Sequences (for gen_random_uuid() defaults and serial ids)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- 8) Future tables: auto-grant to keep new tables from hitting same 42501
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- 9) Ensure service_role bypasses RLS is still effective (it does, but GRANT is prerequisite)
-- No additional RLS change needed; policies from 001/002 remain correct.
