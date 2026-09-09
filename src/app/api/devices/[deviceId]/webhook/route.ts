import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";

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

  const { data: owned } = await supabase
    .from("user_devices")
    .select("id, webhook_url, webhook_secret, webhook_events, webhook_insecure_skip_verify")
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  // Prefer DB, fallback to GOWA if DB empty but GOWA has config
  try {
    const gowaCfg = await gowa<{ results: { webhook_url: string; webhook_secret: string; webhook_events: string; webhook_insecure_skip_verify: boolean; device_id: string } }>({
      path: `/devices/${deviceId}/webhook`,
    });
    if (gowaCfg.results?.webhook_url && !owned.webhook_url) {
      return NextResponse.json({ webhook: gowaCfg.results }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    // ignore, return DB
  }

  return NextResponse.json(
    {
      webhook: {
        device_id: deviceId,
        webhook_url: owned.webhook_url,
        webhook_secret: owned.webhook_secret,
        webhook_events: owned.webhook_events,
        webhook_insecure_skip_verify: owned.webhook_insecure_skip_verify,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(
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
  const { webhook_url, webhook_secret, webhook_events, webhook_insecure_skip_verify } = body as {
    webhook_url: string;
    webhook_secret?: string;
    webhook_events?: string;
    webhook_insecure_skip_verify?: boolean;
  };

  if (webhook_url !== undefined && typeof webhook_url !== "string") {
    return NextResponse.json({ error: "webhook_url harus string" }, { status: 400 });
  }
  if (webhook_url && webhook_url.length > 0) {
    try {
      new URL(webhook_url);
    } catch {
      return NextResponse.json({ error: "webhook_url tidak valid" }, { status: 400 });
    }
  }

  const { error: dbError } = await supabase
    .from("user_devices")
    .update({
      webhook_url: webhook_url || null,
      webhook_secret: webhook_secret || null,
      webhook_events: webhook_events || null,
      webhook_insecure_skip_verify: webhook_insecure_skip_verify ?? false,
    })
    .eq("user_id", user.id)
    .eq("device_key", deviceId);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Sync to GOWA per-device webhook
  try {
    const res = await gowa({
      method: "PATCH",
      path: `/devices/${deviceId}/webhook`,
      body: {
        webhook_url: webhook_url || "",
        webhook_secret,
        webhook_events,
        webhook_insecure_skip_verify,
      },
    });
    return NextResponse.json({ ok: true, gowa: res });
  } catch (err) {
    console.error(`[PATCH /api/devices/${deviceId}/webhook] GOWA sync failed`, err);
    // DB sudah tersimpan, tapi GOWA gagal — kasih warning tapi 200
    return NextResponse.json({ ok: true, warning: err instanceof Error ? err.message : "GOWA sync failed", gowa_error: true });
  }
}
