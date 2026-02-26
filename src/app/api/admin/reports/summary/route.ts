import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ 관리자 요약(대시보드용)
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [users, items, orders] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.order.count(),
  ]);

  return NextResponse.json({ ok: true, stats: { users, items, orders } });
}