import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Log } from "@/types";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deviceKey = searchParams.get("device_key");
  const eventType = searchParams.get("event_type");
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
  const offset = Number(searchParams.get("offset") || "0");

  const service = createServiceClient();

  let query = service
    .from("logs")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (deviceKey) {
    query = query.eq("device_key", deviceKey);
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    logs: (data || []) as Log[],
    total: count ?? 0,
  });
}
