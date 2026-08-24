import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Remove from bot
  try {
    await gowa({ method: "DELETE", path: `/devices/${deviceId}` });
  } catch {
    // Bot might already be gone
  }

  // Remove from DB
  const { error } = await supabase
    .from("user_devices")
    .delete()
    .eq("user_id", user.id)
    .eq("device_key", deviceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
