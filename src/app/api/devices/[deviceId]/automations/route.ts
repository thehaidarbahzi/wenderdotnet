import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: owned } = await supabase.from("user_devices").select("id").eq("user_id", user.id).eq("device_key", deviceId).single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  const { data, error } = await supabase
    .from("device_automations")
    .select("*")
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ automations: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: owned } = await supabase.from("user_devices").select("id").eq("user_id", user.id).eq("device_key", deviceId).single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  const body = await request.json();
  const {
    name,
    trigger_category = "contains",
    pattern,
    is_case_sensitive = false,
    reply,
    is_reply = false,
    mentions,
    duration = 0,
    is_forwarded = false,
    target_type,
    target_jids,
    target_jid,
    enabled = true,
  } = body as {
    name?: string;
    trigger_category?: "prefix" | "contains" | "exact";
    pattern?: string;
    is_case_sensitive?: boolean;
    reply?: string;
    is_reply?: boolean;
    mentions?: string;
    duration?: number;
    is_forwarded?: boolean;
    target_type?: string;
    target_jids?: string[];
    target_jid?: string;
    enabled?: boolean;
  };

  if (!name || !pattern || !reply) {
    return NextResponse.json({ error: "name, pattern, reply wajib diisi" }, { status: 400 });
  }

  const allowedCategories = ["prefix", "contains", "exact"] as const;
  if (!allowedCategories.includes(trigger_category as (typeof allowedCategories)[number])) {
    return NextResponse.json({ error: "trigger_category harus prefix/contains/exact" }, { status: 400 });
  }

  // multi-keyword: split by comma/newline, validate
  const keywords = pattern
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (keywords.length === 0) {
    return NextResponse.json({ error: "Minimal 1 keyword wajib diisi" }, { status: 400 });
  }
  if (keywords.length > 10) {
    return NextResponse.json({ error: "Maksimal 10 keyword per automasi" }, { status: 400 });
  }
  for (const kw of keywords) {
    if (kw.length > 50) return NextResponse.json({ error: `Keyword "${kw.slice(0, 20)}" terlalu panjang (max 50)` }, { status: 400 });
    if (kw.length < 1) return NextResponse.json({ error: "Keyword tidak boleh kosong" }, { status: 400 });
  }
  // normalize pattern: join dengan ", " untuk konsistensi
  const normalizedPattern = keywords.join(", ");

  const derivedTriggerType = "keyword" as const;
  const allowedDurations = [0, 86400, 604800, 7776000];
  if (!allowedDurations.includes(duration)) {
    return NextResponse.json({ error: "duration tidak valid" }, { status: 400 });
  }

  let jids: (string | null)[] = [];
  if (Array.isArray(target_jids) && target_jids.length > 0) jids = target_jids;
  else if (target_jid) jids = [target_jid];
  else jids = [null as unknown as string];

  const rows = jids.map((jid) => ({
    user_id: user.id,
    device_key: deviceId,
    name: jids.length > 1 ? `${name}: ${jid}` : name,
    trigger_category,
    trigger_type: derivedTriggerType,
    pattern: normalizedPattern,
    is_case_sensitive: !!is_case_sensitive,
    reply,
    is_reply,
    mentions: mentions || null,
    duration,
    is_forwarded,
    target_type: target_type || null,
    target_jid: jid || null,
    enabled,
  }));

  const { data, error } = await supabase.from("device_automations").insert(rows).select();

  if (error) {

    if (error.code === "23505") {
      return NextResponse.json({ error: "Automasi dengan nama/pola/target sama sudah ada di device ini" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ automations: data }, { status: 201 });
}
