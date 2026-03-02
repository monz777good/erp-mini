import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ 관리자 요약(대시보드용)
 */
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const [users, items, orders] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.order.count(),
    ]);

    return NextResponse.json({ ok: true, stats: { users, items, orders } });
  } catch (e: any) {
    if (String(e?.message ?? "").startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (String(e?.message ?? "").startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}