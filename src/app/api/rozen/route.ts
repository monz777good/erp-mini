import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ rozen(로젠) 예전 잔재 - 빌드 통과용 더미
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  return NextResponse.json(
    { ok: false, message: "Deprecated endpoint." },
    { status: 410 }
  );
}