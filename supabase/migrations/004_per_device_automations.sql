-- 004: per-device automations (menggantikan rules/device_rules global)
-- Final schema: tanpa regex, multi-keyword via pattern comma, + is_case_sensitive

DROP TABLE IF EXISTS public.device_rules CASCADE;
DROP TABLE IF EXISTS public.rules CASCADE;

CREATE TABLE IF NOT EXISTS public.device_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_key TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_category TEXT NOT NULL DEFAULT 'contains' CHECK (trigger_category IN ('prefix','contains','exact')),
  trigger_type TEXT NOT NULL DEFAULT 'keyword' CHECK (trigger_type IN ('keyword')),
  pattern TEXT NOT NULL,
  is_case_sensitive BOOLEAN NOT NULL DEFAULT false,
  reply TEXT NOT NULL,
  is_reply BOOLEAN NOT NULL DEFAULT false,
  mentions TEXT,
  duration INTEGER NOT NULL DEFAULT 0 CHECK (duration IN (0,86400,604800,7776000)),
  is_forwarded BOOLEAN NOT NULL DEFAULT false,
  target_type TEXT CHECK (target_type IN ('group','private')),
  target_jid TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_automations_user_id ON public.device_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_automations_device_key ON public.device_automations(device_key);
CREATE INDEX IF NOT EXISTS idx_device_automations_device_enabled ON public.device_automations(device_key, enabled);
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_automations_unique ON public.device_automations(device_key, name, target_jid, pattern);

ALTER TABLE public.device_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own automations" ON public.device_automations;
CREATE POLICY "Users can view own automations" ON public.device_automations
  FOR SELECT USING (user_id = auth.uid() AND public.user_owns_device(device_key));

DROP POLICY IF EXISTS "Users can insert own automations" ON public.device_automations;
CREATE POLICY "Users can insert own automations" ON public.device_automations
  FOR INSERT WITH CHECK (user_id = auth.uid() AND public.user_owns_device(device_key));

DROP POLICY IF EXISTS "Users can update own automations" ON public.device_automations;
CREATE POLICY "Users can update own automations" ON public.device_automations
  FOR UPDATE USING (user_id = auth.uid() AND public.user_owns_device(device_key))
  WITH CHECK (user_id = auth.uid() AND public.user_owns_device(device_key));

DROP POLICY IF EXISTS "Users can delete own automations" ON public.device_automations;
CREATE POLICY "Users can delete own automations" ON public.device_automations
  FOR DELETE USING (user_id = auth.uid() AND public.user_owns_device(device_key));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.device_automations TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_device_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_device_automations_updated_at ON public.device_automations;
CREATE TRIGGER set_device_automations_updated_at
  BEFORE UPDATE ON public.device_automations
  FOR EACH ROW EXECUTE FUNCTION public.handle_device_automations_updated_at();
