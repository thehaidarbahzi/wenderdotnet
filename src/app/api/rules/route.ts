import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Rule } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("rules")
    .select("*, device_rules(device_key, enabled)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rules: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    action_type,
    target_type,
    target_jid,
    trigger_type,
    pattern,
    reply,
    auto_read,
    enabled,
    device_keys,
  } = body as {
    name: string;
    action_type: Rule["action_type"];
    target_type?: Rule["target_type"];
    target_jid?: Rule["target_jid"];
    trigger_type?: Rule["trigger_type"];
    pattern?: string;
    reply?: string;
    auto_read?: boolean;
    enabled?: boolean;
    device_keys?: string[];
  };

  if (!name || !action_type) {
    return NextResponse.json(
      { error: "name and action_type are required" },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data: rule, error } = await service
    .from("rules")
    .insert({
      user_id: user.id,
      name,
      action_type,
      target_type: target_type ?? null,
      target_jid: target_jid ?? null,
      trigger_type: trigger_type ?? null,
      pattern: pattern ?? null,
      reply: reply ?? null,
      auto_read: auto_read ?? false,
      enabled: enabled ?? true,
    })
    .select("*, device_rules(device_key, enabled)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (device_keys && device_keys.length > 0) {
    const { error: drError } = await service.from("device_rules").insert(
      device_keys.map((dk) => ({
        device_key: dk,
        rule_id: rule.id,
        enabled: true,
      }))
    );

    if (drError) {
      return NextResponse.json({ error: drError.message }, { status: 500 });
    }

    const { data: updated } = await service
      .from("rules")
      .select("*, device_rules(device_key, enabled)")
      .eq("id", rule.id)
      .single();

    return NextResponse.json({ rule: updated }, { status: 201 });
  }

  return NextResponse.json({ rule }, { status: 201 });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, device_keys, ...fields } = body as Partial<Rule> & {
    id: string;
    device_keys?: string[];
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const service = createServiceClient();

  const { error: updateError } = await service
    .from("rules")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (device_keys) {
    await service.from("device_rules").delete().eq("rule_id", id);

    if (device_keys.length > 0) {
      const { error: drError } = await service.from("device_rules").insert(
        device_keys.map((dk) => ({
          device_key: dk,
          rule_id: id,
          enabled: true,
        }))
      );

      if (drError) {
        return NextResponse.json({ error: drError.message }, { status: 500 });
      }
    }
  }

  const { data: rule, error } = await service
    .from("rules")
    .select("*, device_rules(device_key, enabled)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rule });
}
