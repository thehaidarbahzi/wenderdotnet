import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";

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
    const result = await gowa<{ qr_link: string; qr_duration: number }>({
      path: `/devices/${deviceId}/login`,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 500 }
    );
  }
}
