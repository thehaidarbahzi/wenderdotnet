import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";
import type { GowaResponse } from "@/types";

interface PairCodeResult {
  device_id: string;
  pair_code: string;
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

  const { data: owned } = await supabase
    .from("user_devices")
    .select("id")
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  const url = new URL(request.url);
  let phone = url.searchParams.get("phone");
  if (!phone) {
    try {
      const body = await request.json();
      phone = body.phone;
    } catch {

    }
  }
  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Nomor HP wajib diisi" }, { status: 400 });
  }

  const normalized = phone.replace(/[^0-9]/g, "");
  if (normalized.length < 8) {
    return NextResponse.json({ error: "Format nomor HP tidak valid" }, { status: 400 });
  }

  try {

    const result = await gowa<GowaResponse<PairCodeResult>>({
      method: "POST",
      path: `/devices/${deviceId}/login/code`,
      query: { phone: normalized },
    });
    const payload = result.results ?? (result as unknown as PairCodeResult);
    return NextResponse.json(
      {
        pair_code: payload.pair_code,
        device_id: payload.device_id ?? deviceId,
        results: payload,
        code: result.code,
        message: result.message,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error(`[POST /api/devices/${deviceId}/login/code]`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mendapatkan kode pairing" },
      { status: 500 }
    );
  }
}
