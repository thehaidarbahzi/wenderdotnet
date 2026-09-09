import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";
import type { GowaResponse, LoginResponse } from "@/types";

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
    // openapi.yaml: GET /devices/{device_id}/login -> DeviceLoginResponse { results: { qr_link, qr_duration } }
    const result = await gowa<GowaResponse<LoginResponse>>({
      path: `/devices/${deviceId}/login`,
    });

    // Frontend expects flat { qr_link, qr_duration } (lihat page.tsx), tapi GOWA membungkus di results
    // Return flat + wrapper agar backward compatible dengan kedua shape
    const payload = result.results ?? (result as unknown as LoginResponse);
    return NextResponse.json(
      {
        qr_link: payload.qr_link,
        qr_duration: payload.qr_duration,
        device_id: payload.device_id ?? deviceId,
        // keep wrapper for debugging
        results: payload,
        code: result.code,
        message: result.message,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error(`[GET /api/devices/${deviceId}/login]`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 500 }
    );
  }
}
