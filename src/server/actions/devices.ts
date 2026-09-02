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

  // Prod: single /devices call + parallel /status (hindari N+1 sequential)
  let botDeviceIds = new Set<string>();
  try {
    const botDevices = await gowa<GowaResponse<DeviceInfo[]>>({ path: "/devices" });
    botDeviceIds = new Set((botDevices.results ?? []).map((d) => d.id));
  } catch {
    // GOWA down -> fallback disconnected
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

export interface DeviceWebhookConfig {
  webhook_url: string | null;
  webhook_secret: string | null;
  webhook_events: string | null;
  webhook_insecure_skip_verify: boolean;
}

export async function getDeviceWebhook(deviceId: string): Promise<DeviceWebhookConfig> {
  await assertDeviceOwner(deviceId);
  // Prefer DB (source of truth for UI), fallback to GOWA per-device config
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_devices")
    .select("webhook_url, webhook_secret, webhook_events, webhook_insecure_skip_verify")
    .eq("device_key", deviceId)
    .single();
  if (data && data.webhook_url !== undefined) {
    try {
      const gowaCfg = await gowa<{
        results: DeviceWebhookConfig & { device_id: string };
      }>({ path: `/devices/${deviceId}/webhook` });
      // If GOWA has value but DB is empty, sync DB
      if (gowaCfg.results?.webhook_url && !data.webhook_url) return gowaCfg.results;
    } catch {}
    return data as DeviceWebhookConfig;
  }
  const res = await gowa<{ results: DeviceWebhookConfig & { device_id: string } }>({
    path: `/devices/${deviceId}/webhook`,
  });
  return res.results;
}

export async function updateDeviceWebhook(
  deviceId: string,
  config: { webhook_url: string; webhook_secret?: string; webhook_events?: string; webhook_insecure_skip_verify?: boolean }
) {
  await assertDeviceOwner(deviceId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // 1) Persist in Supabase (RLS ensures owner only) - enables UI history even if GOWA storage wiped
  const { error: dbError } = await supabase
    .from("user_devices")
    .update({
      webhook_url: config.webhook_url || null,
      webhook_secret: config.webhook_secret || null,
      webhook_events: config.webhook_events || null,
      webhook_insecure_skip_verify: config.webhook_insecure_skip_verify ?? false,
    })
    .eq("user_id", user.id)
    .eq("device_key", deviceId);
  if (dbError) throw dbError;

  // 2) Sync to GOWA per-device webhook (overrides global WHATSAPP_WEBHOOK_URL for this device)
  // openapi.yaml: PATCH /devices/{device_id}/webhook
  return gowa({
    method: "PATCH",
    path: `/devices/${deviceId}/webhook`,
    body: {
      webhook_url: config.webhook_url,
      webhook_secret: config.webhook_secret,
      webhook_events: config.webhook_events,
      webhook_insecure_skip_verify: config.webhook_insecure_skip_verify,
    },
  });
}
