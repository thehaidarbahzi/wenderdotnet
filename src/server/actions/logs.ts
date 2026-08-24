import { createServiceClient } from "@/lib/supabase/server";

export interface LogEntry {
  id: string;
  user_id: string;
  device_key: string;
  event_type: string;
  chat_jid: string | null;
  chat_name: string | null;
  sender_jid: string | null;
  sender_name: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function getLogs(
  userId: string,
  options: { device_key?: string; event_type?: string; limit?: number; offset?: number } = {}
): Promise<{ logs: LogEntry[]; total: number }> {
  const supabase = createServiceClient();
  const { device_key, event_type, limit = 50, offset = 0 } = options;

  let query = supabase
    .from("logs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (device_key) {
    query = query.eq("device_key", device_key);
  }
  if (event_type) {
    query = query.eq("event_type", event_type);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return { logs: data || [], total: count || 0 };
}
