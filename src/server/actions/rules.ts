import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface Rule {
  id: string;
  user_id: string;
  name: string;
  action_type: "listen" | "auto_reply";
  target_type: string | null;
  target_jid: string | null;
  trigger_type: string | null;
  pattern: string | null;
  reply: string | null;
  auto_read: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  device_rules?: { device_key: string; enabled: boolean }[];
}

async function requireAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function getRules(userId: string): Promise<Rule[]> {
  const callerId = await requireAuthUserId();
  if (callerId !== userId) throw new Error("Forbidden: bukan milik Anda");
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("rules")
    .select("*, device_rules(device_key, enabled)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function filterOwnedDeviceKeys(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  deviceKeys: string[]
): Promise<string[]> {
  if (deviceKeys.length === 0) return [];
  const { data: owned } = await supabase
    .from("user_devices")
    .select("device_key")
    .eq("user_id", userId)
    .in("device_key", deviceKeys);
  const ownedSet = new Set((owned ?? []).map((r) => r.device_key));
  return deviceKeys.filter((k) => ownedSet.has(k));
}

export async function createRule(
  userId: string,
  rule: Omit<Rule, "id" | "user_id" | "created_at" | "updated_at" | "device_rules">,
  deviceKeys: string[]
) {
  const callerId = await requireAuthUserId();
  if (callerId !== userId) throw new Error("Forbidden: bukan milik Anda");
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("rules")
    .insert({ ...rule, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  const safeKeys = await filterOwnedDeviceKeys(supabase, userId, deviceKeys);
  if (safeKeys.length !== deviceKeys.length) {
    console.warn(`createRule: filtered ${deviceKeys.length - safeKeys.length} unowned device_keys`);
  }

  if (safeKeys.length > 0) {
    const { error: drError } = await supabase.from("device_rules").insert(
      safeKeys.map((dk) => ({
        device_key: dk,
        rule_id: data.id,
        enabled: true,
      }))
    );
    if (drError) throw drError;
  }

  return data;
}

export async function updateRule(
  ruleId: string,
  rule: Partial<Rule>,
  deviceKeys: string[]
) {
  const callerId = await requireAuthUserId();
  const supabase = createServiceClient();

  // Verify rule belongs to caller - get owner to filter deviceKeys
  const { data: existingRule } = await supabase.from("rules").select("user_id").eq("id", ruleId).single();
  if (!existingRule) throw new Error("Rule tidak ditemukan");
  const ownerId = existingRule.user_id as string;
  if (ownerId !== callerId) throw new Error("Forbidden: bukan milik Anda");

  const { error } = await supabase
    .from("rules")
    .update(rule)
    .eq("id", ruleId)
    .eq("user_id", ownerId);

  if (error) throw error;

  // Replace device assignments
  await supabase.from("device_rules").delete().eq("rule_id", ruleId);

  const safeKeys = await filterOwnedDeviceKeys(supabase, ownerId, deviceKeys);
  if (safeKeys.length !== deviceKeys.length) {
    console.warn(`updateRule: filtered ${deviceKeys.length - safeKeys.length} unowned device_keys`);
  }

  if (safeKeys.length > 0) {
    const { error: drError } = await supabase.from("device_rules").insert(
      safeKeys.map((dk) => ({
        device_key: dk,
        rule_id: ruleId,
        enabled: true,
      }))
    );
    if (drError) throw drError;
  }
}

export async function deleteRule(ruleId: string) {
  const callerId = await requireAuthUserId();
  const supabase = createServiceClient();
  const { data: existing } = await supabase.from("rules").select("user_id").eq("id", ruleId).single();
  if (!existing) throw new Error("Rule tidak ditemukan");
  if ((existing.user_id as string) !== callerId) throw new Error("Forbidden: bukan milik Anda");

  const { error } = await supabase.from("rules").delete().eq("id", ruleId).eq("user_id", callerId);
  if (error) throw error;
}
