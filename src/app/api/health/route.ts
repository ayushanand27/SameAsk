import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "sameask",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
}
