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

  const { data: userDevices } = await supabase
    .from("user_devices")
    .select("device_key, name")
    .eq("user_id", user.id);

  if (!userDevices || userDevices.length === 0) return [];

  let botDeviceIds = new Set<string>();
  try {
    const botDevices = await gowa<GowaResponse<DeviceInfo[]>>({ path: "/devices" });
    botDeviceIds = new Set((botDevices.results ?? []).map((d) => d.id));
  } catch {

  }

  const results = await Promise.all(
    userDevices.map(async (ud) => {
      if (!botDeviceIds.has(ud.device_key)) {
        return {
          id: ud.device_key,
          display_name: ud.name,
          state: "disconnected" as const,
          jid: "",
          is_connected: false,
          is_logged_in: false,
        } as DeviceWithStatus;
      }
      try {
        const status = await gowa<
          GowaResponse<{ is_connected: boolean; is_logged_in: boolean; jid: string }>
        >({ path: `/devices/${ud.device_key}/status` });
        const is_connected = status.results?.is_connected ?? false;
        const is_logged_in = status.results?.is_logged_in ?? false;
        return {
          id: ud.device_key,
          display_name: ud.name,
          state: is_logged_in ? "logged_in" : is_connected ? "connecting" : "disconnected",
          jid: status.results?.jid ?? "",
          is_connected,
          is_logged_in,
        } as DeviceWithStatus;
      } catch {
        return {
          id: ud.device_key,
          display_name: ud.name,
          state: "disconnected" as const,
          jid: "",
          is_connected: false,
          is_logged_in: false,
        } as DeviceWithStatus;
      }
    })
  );

  return results;
}

export async function addDevice(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const crypto = await import("crypto");
  const deviceSuffix = crypto.randomUUID().slice(0, 8);
  const result = await gowa<GowaResponse<{ id: string }>>({
    method: "POST",
    path: "/devices",
    body: { device_id: `wdn_${Date.now()}_${deviceSuffix}` },
  });

  const deviceId = result.results?.id;

  if (!deviceId) {
    throw new Error("Gagal membuat device slot");
  }

  return { device_id: deviceId, name };
}

async function assertDeviceOwner(deviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data } = await supabase
    .from("user_devices")
    .select("id")
    .eq("user_id", user.id)
    .eq("device_key", deviceId)
    .single();
  if (!data) throw new Error("Device tidak ditemukan atau bukan milik Anda");
  return user;
}

export async function loginDevice(deviceId: string) {
  await assertDeviceOwner(deviceId);
  return gowa<GowaResponse<{ device_id: string; qr_link: string; qr_duration: number }>>({
    path: `/devices/${deviceId}/login`,
  });
}

export async function loginDeviceWithCode(deviceId: string, phone: string) {
  await assertDeviceOwner(deviceId);
  return gowa<GowaResponse<{ device_id: string; pair_code: string }>>({
    method: "POST",
    path: `/devices/${deviceId}/login/code`,
    query: { phone },
  });
}

export async function getDeviceStatus(deviceId: string) {
  await assertDeviceOwner(deviceId);
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
  await assertDeviceOwner(deviceId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  try {
    await gowa({
      method: "DELETE",
      path: `/devices/${deviceId}`,
    });
  } catch {}

  const { error } = await supabase
    .from("user_devices")
    .delete()
    .eq("user_id", user.id)
    .eq("device_key", deviceId);

  if (error) throw error;
}

export async function logoutDevice(deviceId: string) {
  await assertDeviceOwner(deviceId);
  return gowa({
    method: "POST",
    path: `/devices/${deviceId}/logout`,
  });
}

export async function reconnectDevice(deviceId: string) {
  await assertDeviceOwner(deviceId);
  return gowa({
    method: "POST",
    path: `/devices/${deviceId}/reconnect`,
  });
}
