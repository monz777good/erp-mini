import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const [totalOrders, totalUsers, totalItems] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.item.count(),
    ]);

    return NextResponse.json({
      ok: true,
      stats: { totalOrders, totalUsers, totalItems },
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e);

    if (msg.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}