import { createServiceClient } from "@/lib/supabase/server";

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

export async function getRules(userId: string): Promise<Rule[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("rules")
    .select("*, device_rules(device_key, enabled)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createRule(
  userId: string,
  rule: Omit<Rule, "id" | "user_id" | "created_at" | "updated_at" | "device_rules">,
  deviceKeys: string[]
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("rules")
    .insert({ ...rule, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  if (deviceKeys.length > 0) {
    const { error: drError } = await supabase.from("device_rules").insert(
      deviceKeys.map((dk) => ({
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
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("rules")
    .update(rule)
    .eq("id", ruleId);

  if (error) throw error;

  // Replace device assignments
  await supabase.from("device_rules").delete().eq("rule_id", ruleId);

  if (deviceKeys.length > 0) {
    const { error: drError } = await supabase.from("device_rules").insert(
      deviceKeys.map((dk) => ({
        device_key: dk,
        rule_id: ruleId,
        enabled: true,
      }))
    );
    if (drError) throw drError;
  }
}

export async function deleteRule(ruleId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("rules").delete().eq("id", ruleId);
  if (error) throw error;
}
