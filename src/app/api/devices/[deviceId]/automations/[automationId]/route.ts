import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ deviceId: string; automationId: string }> }
) {
  const { deviceId, automationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: owned } = await supabase.from("user_devices").select("id").eq("user_id", user.id).eq("device_key", deviceId).single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  const body = await request.json();
  const allowed = [
    "name",
    "trigger_category",
    "trigger_type",
    "pattern",
    "reply",
    "is_reply",
    "mentions",
    "duration",
    "is_forwarded",
    "target_type",
    "target_jid",
    "enabled",
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 });

  const { data, error } = await supabase
    .from("device_automations")
    .update(updates)
    .eq("id", automationId)
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ automation: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string; automationId: string }> }
) {
  const { deviceId, automationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: owned } = await supabase.from("user_devices").select("id").eq("user_id", user.id).eq("device_key", deviceId).single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  const { error } = await supabase.from("device_automations").delete().eq("id", automationId).eq("user_id", user.id).eq("device_key", deviceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deviceId: string; automationId: string }> }
) {
  // alias for toggle enabled — reuse PUT
  const { deviceId: did, automationId: aid } = await params;
  return PUT(request, { params: Promise.resolve({ deviceId: did, automationId: aid }) } as unknown as { params: Promise<{ deviceId: string; automationId: string }> });
}
