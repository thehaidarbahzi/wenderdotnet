import { NextResponse } from "next/server";
import { gowa } from "@/lib/gowa";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  try {
    const result = await gowa<{
      is_connected: boolean;
      is_logged_in: boolean;
      device_id: string;
      jid: string;
    }>({
      path: `/devices/${deviceId}/status`,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status check failed" },
      { status: 500 }
    );
  }
}
