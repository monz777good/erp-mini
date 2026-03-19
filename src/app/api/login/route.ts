import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("=== LOGIN BLOCK TEST ===");

  return NextResponse.json(
    { ok: false, error: "LOGIN_BLOCK_TEST" },
    { status: 401 }
  );
}