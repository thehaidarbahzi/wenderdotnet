import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";
import type { GowaResponse, DeviceInfo } from "@/types";

export const dynamic = "force-dynamic";

// Prod: single GOWA call + parallel status fetch. Jangan fetch /devices per loop (N+1).
// Cache-control: no-store karena status live, tapi frontend boleh SWR 10-15s.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userDevices } = await supabase
    .from("user_devices")
    .select("device_key, name")
    .eq("user_id", user.id);

  if (!userDevices || userDevices.length === 0) {
    return NextResponse.json({ devices: [] });
  }

  // 1) Single fetch daftar device di GOWA (1 call, bukan N)
  let botDeviceIds = new Set<string>();
  try {
    const botDevices = await gowa<GowaResponse<DeviceInfo[]>>({ path: "/devices" });
    botDeviceIds = new Set((botDevices.results ?? []).map((d) => d.id));
  } catch {
    // GOWA down -> semua dianggap disconnected, tetap return 200 agar UI tidak error
  }

  // 2) Parallel fetch status per device yang ada di GOWA (max concurrency = all, GOWA ringan)
  const devices = await Promise.all(
    userDevices.map(async (ud) => {
      if (!botDeviceIds.has(ud.device_key)) {
        return { id: ud.device_key, display_name: ud.name, state: "disconnected" as const };
      }
      try {
        const status = await gowa<GowaResponse<{ is_connected: boolean; is_logged_in: boolean }>>({
          path: `/devices/${ud.device_key}/status`,
        });
        const state = status.results?.is_logged_in
          ? ("logged_in" as const)
          : status.results?.is_connected
            ? ("connecting" as const)
            : ("disconnected" as const);
        return { id: ud.device_key, display_name: ud.name, state };
      } catch {
        return { id: ud.device_key, display_name: ud.name, state: "disconnected" as const };
      }
    })
  );

  return NextResponse.json(
    { devices },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Create device slot in bot
  const deviceId = `wdn_${Date.now()}`;

  try {
    await gowa({
      method: "POST",
      path: "/devices",
      body: { device_id: deviceId },
    });
  } catch (e) {
    console.error("[POST /api/devices] GOWA failed:", e);
    const msg = e instanceof Error ? e.message : "Gagal membuat device di bot";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }

  // Persist ownership in DB immediately (RLS: user_id = auth.uid())
  // Kalau insert gagal (mis. duplicate), rollback slot di GOWA agar tidak orphan
  const { error: dbError } = await supabase
    .from("user_devices")
    .insert({ user_id: user.id, device_key: deviceId, name });

  if (dbError) {
    console.error("[POST /api/devices] Supabase insert failed:", dbError);
    try {
      await gowa({ method: "DELETE", path: `/devices/${deviceId}` });
    } catch {}
    // Hint untuk kasus 42501 yang sering terjadi kalau migration 003_grants.sql belum dijalankan
    const hint =
      dbError.code === "42501"
        ? " (permission denied — jalankan supabase/migrations/003_grants.sql di Supabase SQL Editor)"
        : "";
    return NextResponse.json({ error: dbError.message + hint, code: dbError.code }, { status: 500 });
  }

  return NextResponse.json({
    device: { id: deviceId, name },
  });
}
