import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [totalOrders, totalUsers, totalItems] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.item.count(),
  ]);

  return NextResponse.json({
    ok: true,
    stats: { totalOrders, totalUsers, totalItems },
  });
}