import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: owned } = await supabase
    .from("user_devices")
    .select("webhook_url, webhook_secret, webhook_events, webhook_insecure_skip_verify")
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  const webhookUrl = owned.webhook_url;
  if (!webhookUrl) return NextResponse.json({ error: "Webhook belum dikonfigurasi" }, { status: 400 });

  let customPayload: unknown = null;
  try {
    const body = await request.json().catch(() => ({}));
    customPayload = body?.payload;
  } catch {}

  const payload = customPayload ?? {
    event: "test",
    device_id: deviceId,
    timestamp: new Date().toISOString(),
    data: {
      message: "Test webhook dari wenderdotnet",
      from: "wenderdotnet-test",
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(owned.webhook_secret ? { "X-Webhook-Secret": owned.webhook_secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // skip verify not directly supported in fetch; user must use http or valid cert
    });
    const text = await res.text().catch(() => "");
    clearTimeout(timeout);
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      body: text.slice(0, 2000),
      webhook_url: webhookUrl,
    });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : "Gagal hit webhook";
    const isAbort = msg.includes("abort");
    return NextResponse.json(
      { error: isAbort ? "Timeout 8s - webhook tidak merespon" : msg, webhook_url: webhookUrl },
      { status: 500 }
    );
  }
}
