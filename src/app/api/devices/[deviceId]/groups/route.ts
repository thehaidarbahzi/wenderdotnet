import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";

export const dynamic = "force-dynamic";

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

  const { data: owned } = await supabase.from("user_devices").select("id").eq("user_id", user.id).eq("device_key", deviceId).single();
  if (!owned) return NextResponse.json({ error: "Device tidak ditemukan atau bukan milik Anda" }, { status: 403 });

  try {

    const res = await gowa<{
      code: string;
      message: string;
      results: { data: Array<{ JID: string; Name: string; ParticipantCount?: number }> };
    }>({
      path: "/user/my/groups",
      device_id: deviceId,
    });

    const groups = res.results?.data ?? (res as unknown as { data: unknown[] }).data ?? [];

    return NextResponse.json(
      { groups },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil grup";

    if (msg.includes("401") || msg.includes("not logged") || msg.includes("400")) {
      return NextResponse.json({ error: "Device belum terhubung. Hubungkan dulu.", groups: [] }, { status: 400 });
    }
    return NextResponse.json({ error: msg, groups: [] }, { status: 500 });
  }
}
