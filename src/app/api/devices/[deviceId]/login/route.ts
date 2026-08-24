import { NextResponse } from "next/server";
import { gowa } from "@/lib/gowa";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

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
