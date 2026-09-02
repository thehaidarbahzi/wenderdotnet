-- 002: per-user device isolation + per-device webhook
-- Fixes RLS gaps in 001 and adds multi-webhook support (mirrors GOWA per-device webhook)

-- 1) Device key must be globally unique, not just per-user.
--    001 had UNIQUE(user_id, device_key) which allowed hijack:
--    user B could claim device_key that belongs to user A.
--    We keep the old constraint for compatibility and add a global one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_device_key_unique
  ON public.user_devices(device_key);

-- 2) Per-device webhook config (optional, per device).
--    Mirrors fields accepted by POST /devices and PATCH /devices/{id}/webhook in openapi.yaml
--    If webhook_url IS NULL -> fallback to global WHATSAPP_WEBHOOK_URL (compose.yaml:17)
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS webhook_secret TEXT;
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS webhook_events TEXT;
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS webhook_insecure_skip_verify BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3) Index for fast ownership check on device_rules
CREATE INDEX IF NOT EXISTS idx_device_rules_device_key
  ON public.device_rules(device_key);

-- 4) Helper for RLS: does auth user own this device_key?
CREATE OR REPLACE FUNCTION public.user_owns_device(p_device_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_devices
    WHERE device_key = p_device_key AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 5) user_devices: add missing UPDATE policy (001 only had SELECT/INSERT/DELETE)
DROP POLICY IF EXISTS "Users can update own devices" ON public.user_devices;
CREATE POLICY "Users can update own devices" ON public.user_devices
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6) device_rules: 001 only checked rule ownership, not device ownership.
--    Attack: user A creates rule A, then inserts (device_key=victim_device, rule_id=A)
--    -> auto_reply runs on victim's device. Also predictable device_key wdn_{timestamp}.
--    Fix: require BOTH rule.user_id = auth.uid() AND deviceKey owned by auth.uid().
DROP POLICY IF EXISTS "Users can view own device_rules" ON public.device_rules;
DROP POLICY IF EXISTS "Users can insert own device_rules" ON public.device_rules;
DROP POLICY IF EXISTS "Users can delete own device_rules" ON public.device_rules;
DROP POLICY IF EXISTS "Users can update own device_rules" ON public.device_rules;

CREATE POLICY "Users can view own device_rules" ON public.device_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rules r WHERE r.id = rule_id AND r.user_id = auth.uid())
    AND public.user_owns_device(device_key)
  );

CREATE POLICY "Users can insert own device_rules" ON public.device_rules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.rules r WHERE r.id = rule_id AND r.user_id = auth.uid())
    AND public.user_owns_device(device_key)
  );

CREATE POLICY "Users can update own device_rules" ON public.device_rules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.rules r WHERE r.id = rule_id AND r.user_id = auth.uid())
    AND public.user_owns_device(device_key)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.rules r WHERE r.id = rule_id AND r.user_id = auth.uid())
    AND public.user_owns_device(device_key)
  );

CREATE POLICY "Users can delete own device_rules" ON public.device_rules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.rules r WHERE r.id = rule_id AND r.user_id = auth.uid())
    AND public.user_owns_device(device_key)
  );

-- 7) auto-update updated_at on user_devices (for webhook config changes)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_devices_updated_at ON public.user_devices;
CREATE TRIGGER set_user_devices_updated_at
  BEFORE UPDATE ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8) logs: ensure SELECT remains owner-only (already correct) but add explicit
--    comment that INSERT must go via service_role (webhook route uses createServiceClient)
--    No anon INSERT policy = intentional. Do NOT add one.

-- Notes for app layer:
-- - Keep global WHATSAPP_WEBHOOK_URL in compose.yaml as fallback.
-- - When user sets per-device webhook, app must: 1) UPDATE user_devices webhook_* columns (RLS ensures owner)
--   and 2) PATCH /devices/{device_id}/webhook on GOWA. GOWA persists it in volume whatsapp:/app/storages.
-- - On device creation (src/server/actions/devices.ts:addDevice) optionally pass webhook_url to POST /devices.
