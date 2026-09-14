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
    .select("id")
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  try {
    const result = await gowa<{
      results: { is_connected: boolean; is_logged_in: boolean; device_id: string; jid: string };
      status: number;
      code: string;
    }>({
      path: `/devices/${deviceId}/status`,
    });

    const r = result.results ?? (result as unknown as { is_connected: boolean; is_logged_in: boolean });
    let is_connected = (r as { is_connected: boolean }).is_connected ?? false;
    let is_logged_in = (r as { is_logged_in: boolean }).is_logged_in ?? false;
    let jid = (r as { jid?: string }).jid ?? "";

    // DeviceStatusResponse tidak mengembalikan jid (hanya device_id, is_connected, is_logged_in).
    // Ambil JID lewat /app/status dengan X-Device-Id header jika masih kosong dan sudah login.
    if (!jid) {
      try {
        const appStatus = await gowa<{
          results: { is_connected: boolean; is_logged_in: boolean; device_id: string; jid: string };
        }>({
          path: "/app/status",
          device_id: deviceId,
        });
        const ar = appStatus.results ?? (appStatus as unknown as { jid?: string });
        const ajid = (ar as { jid?: string }).jid;
        if (ajid) jid = ajid;
        // sinkronkan status jika /devices memberi false tapi /app/status true
        if (typeof (ar as { is_connected?: boolean }).is_connected === "boolean") {
          is_connected = (ar as { is_connected: boolean }).is_connected;
        }
        if (typeof (ar as { is_logged_in?: boolean }).is_logged_in === "boolean") {
          is_logged_in = (ar as { is_logged_in: boolean }).is_logged_in;
        }
      } catch {}
    }

    return NextResponse.json(
      {
        ...result,

        is_connected,
        is_logged_in,
        device_id: (r as { device_id?: string }).device_id ?? deviceId,
        jid,
        state: is_logged_in ? "logged_in" : is_connected ? "connecting" : "disconnected",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status check failed" },
      { status: 500 }
    );
  }
}
