import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";

export async function POST(
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

  try {
    await gowa({ method: "POST", path: `/devices/${deviceId}/logout` });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Logout failed" },
      { status: 500 }
    );
  }
}
