import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asOrderStatus(v: any): OrderStatus | null {
  const s = String(v ?? "").toUpperCase();
  if (s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "DONE") return OrderStatus.DONE;
  return null;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const status = asOrderStatus(url.searchParams.get("status"));
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const createdAt: any = {};
  if (from) createdAt.gte = new Date(from);
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    createdAt.lte = d;
  }

  const where: any = {};
  if (status) where.status = status;
  if (from || to) where.createdAt = createdAt;

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true, role: true } },
      item: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } }, // ✅ bizRegNo 제거
    },
  });

  return NextResponse.json({ ok: true, rows, orders: rows });
}