import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ 주문 요약 리포트
 */
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const [total, requested, approved, rejected, done] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "REQUESTED" } }),
      prisma.order.count({ where: { status: "APPROVED" } }),
      prisma.order.count({ where: { status: "REJECTED" } }),
      prisma.order.count({ where: { status: "DONE" } }),
    ]);

    return NextResponse.json({
      ok: true,
      summary: { total, requested, approved, rejected, done },
    });
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