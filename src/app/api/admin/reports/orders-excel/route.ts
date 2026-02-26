import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ 품목 엑셀(리포트) - 빌드 통과/안전 버전
 * - 일단 JSON으로 내려줌 (엑셀 생성은 나중에 다시 붙이기)
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, items });
}