import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";
import type { GowaResponse, DeviceInfo } from "@/types";

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

  const devices = [];

  for (const ud of userDevices) {
    try {
      const botDevices = await gowa<GowaResponse<DeviceInfo[]>>({
        path: "/devices",
      });
      const botDevice = botDevices.results?.find(
        (d) => d.id === ud.device_key
      );

      let state = "disconnected";
      if (botDevice) {
        try {
          const status = await gowa<
            GowaResponse<{ is_connected: boolean; is_logged_in: boolean }>
          >({
            path: `/devices/${ud.device_key}/status`,
          });
          if (status.results?.is_logged_in) state = "logged_in";
          else if (status.results?.is_connected) state = "connecting";
        } catch {
          // status check failed
        }
      }

      devices.push({
        id: ud.device_key,
        display_name: ud.name,
        state,
      });
    } catch {
      devices.push({
        id: ud.device_key,
        display_name: ud.name,
        state: "disconnected",
      });
    }
  }

  return NextResponse.json({ devices });
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
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat device di bot" },
      { status: 500 }
    );
  }

  // Return device info (NOT inserted into DB yet — that happens after login)
  return NextResponse.json({
    device: { id: deviceId, name },
  });
}
