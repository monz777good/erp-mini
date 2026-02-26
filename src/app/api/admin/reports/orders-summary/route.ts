import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ 주문 요약 리포트
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

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
}