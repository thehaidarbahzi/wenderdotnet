-- wenderdotnet database migration
-- Run this in Supabase SQL Editor

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Newsletters (public insert, admin select)
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User devices (junction: user <-> device_key from bot)
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_key TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_key)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);

-- Rules
CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('listen', 'auto_reply')),
  target_type TEXT CHECK (target_type IN ('group', 'private')),
  target_jid TEXT,
  trigger_type TEXT CHECK (trigger_type IN ('keyword', 'regex')),
  pattern TEXT,
  reply TEXT,
  auto_read BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rules_user_id ON public.rules(user_id);

-- Device rules (junction: rule <-> device_key)
CREATE TABLE IF NOT EXISTS public.device_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key TEXT NOT NULL,
  rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(device_key, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_device_rules_rule_id ON public.device_rules(rule_id);

-- Logs (append-only activity)
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'message_sent', 'message_received', 'auto_reply_sent',
    'auto_read', 'session_connected', 'session_disconnected', 'error'
  )),
  chat_jid TEXT,
  chat_name TEXT,
  sender_jid TEXT,
  sender_name TEXT,
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_user_created ON public.logs(user_id, created_at DESC);

-- RLS Policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- users: own profile only
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- newsletters: public insert, no public select
CREATE POLICY "Anyone can subscribe" ON public.newsletters
  FOR INSERT WITH CHECK (true);

-- user_devices: own devices only
CREATE POLICY "Users can view own devices" ON public.user_devices
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own devices" ON public.user_devices
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own devices" ON public.user_devices
  FOR DELETE USING (user_id = auth.uid());

-- rules: own rules only
CREATE POLICY "Users can view own rules" ON public.rules
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rules" ON public.rules
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rules" ON public.rules
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own rules" ON public.rules
  FOR DELETE USING (user_id = auth.uid());

-- device_rules: via rules.user_id
CREATE POLICY "Users can view own device_rules" ON public.device_rules
  FOR SELECT USING (
    rule_id IN (SELECT id FROM public.rules WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own device_rules" ON public.device_rules
  FOR INSERT WITH CHECK (
    rule_id IN (SELECT id FROM public.rules WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own device_rules" ON public.device_rules
  FOR DELETE USING (
    rule_id IN (SELECT id FROM public.rules WHERE user_id = auth.uid())
  );

-- logs: own logs only
CREATE POLICY "Users can view own logs" ON public.logs
  FOR SELECT USING (user_id = auth.uid());

-- Service role bypass (for webhook receiver)
-- The webhook route uses createServiceClient which bypasses RLS automatically
