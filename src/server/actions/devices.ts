import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { gowa } from "@/lib/gowa";
import type { GowaResponse, DeviceInfo } from "@/types";

export interface DeviceWithStatus extends DeviceInfo {
  is_connected: boolean;
  is_logged_in: boolean;
}

export async function getDevices(): Promise<DeviceWithStatus[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Get user's device keys from DB
  const { data: userDevices } = await supabase
    .from("user_devices")
    .select("device_key, name")
    .eq("user_id", user.id);

  if (!userDevices || userDevices.length === 0) return [];

  // Get live status from bot API for each device
  const devicesWithStatus: DeviceWithStatus[] = [];

  for (const ud of userDevices) {
    try {
      const botDevices = await gowa<GowaResponse<DeviceInfo[]>>({
        path: "/devices",
      });
      const botDevice = botDevices.results?.find(
        (d) => d.id === ud.device_key
      );

      let is_connected = false;
      let is_logged_in = false;

      if (botDevice) {
        const status = await gowa<GowaResponse<{ is_connected: boolean; is_logged_in: boolean }>>({
          path: `/devices/${ud.device_key}/status`,
        });
        is_connected = status.results?.is_connected ?? false;
        is_logged_in = status.results?.is_logged_in ?? false;
      }

      devicesWithStatus.push({
        id: ud.device_key,
        display_name: ud.name,
        state: is_logged_in ? "logged_in" : is_connected ? "connecting" : "disconnected",
        jid: "",
        is_connected,
        is_logged_in,
      });
    } catch {
      devicesWithStatus.push({
        id: ud.device_key,
        display_name: ud.name,
        state: "disconnected",
        jid: "",
        is_connected: false,
        is_logged_in: false,
      });
    }
  }

  return devicesWithStatus;
}

export async function addDevice(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Create device slot in bot
  const result = await gowa<GowaResponse<{ id: string }>>({
    method: "POST",
    path: "/devices",
    body: { device_id: `wdn_${Date.now()}` },
  });

  const deviceId = result.results?.id;

  if (!deviceId) {
    throw new Error("Gagal membuat device slot");
  }

  return { device_id: deviceId, name };
}

export async function loginDevice(deviceId: string) {
  return gowa<GowaResponse<{ device_id: string; qr_link: string; qr_duration: number }>>({
    path: `/devices/${deviceId}/login`,
  });
}

export async function loginDeviceWithCode(deviceId: string, phone: string) {
  return gowa<GowaResponse<{ device_id: string; pair_code: string }>>({
    method: "POST",
    path: `/devices/${deviceId}/login/code`,
    query: { phone },
  });
}

export async function getDeviceStatus(deviceId: string) {
  return gowa<GowaResponse<{ is_connected: boolean; is_logged_in: boolean; device_id: string; jid: string }>>({
    path: `/devices/${deviceId}/status`,
  });
}

export async function insertUserDevice(
  deviceId: string,
  name: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Upsert guard
  const { data: existing } = await supabase
    .from("user_devices")
    .select("id")
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("user_devices")
    .insert({ user_id: user.id, device_key: deviceId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDevice(deviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Remove from bot
  try {
    await gowa({
      method: "DELETE",
      path: `/devices/${deviceId}`,
    });
  } catch {
    // Bot might already be gone
  }

  // Remove from DB
  const { error } = await supabase
    .from("user_devices")
    .delete()
    .eq("user_id", user.id)
    .eq("device_key", deviceId);

  if (error) throw error;
}

export async function logoutDevice(deviceId: string) {
  return gowa({
    method: "POST",
    path: `/devices/${deviceId}/logout`,
  });
}

export async function reconnectDevice(deviceId: string) {
  return gowa({
    method: "POST",
    path: `/devices/${deviceId}/reconnect`,
  });
}
