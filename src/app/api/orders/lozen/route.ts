import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ 로젠 관련(예전 잔재) - 빌드 통과용 더미
 * - 지금은 export/logen-ship 쪽을 쓰는 구조로 가는 게 맞음
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  return NextResponse.json(
    { ok: false, message: "Deprecated endpoint. Use /api/orders/export/logen-ship" },
    { status: 410 }
  );
}