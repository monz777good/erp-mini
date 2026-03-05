import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { OrderStatus, Role } from "@prisma/client";

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

export async function GET(req: Request) {
  const user = await getSessionUser(); //  req  
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

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

  //  ADMIN , SALES  
  if (user.role !== Role.ADMIN) {
    where.userId = user.id;
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      item: true, //  ! items  item
      user: { select: { id: true, name: true, phone: true, role: true } },
    },
  });

  return NextResponse.json({ ok: true, rows });
}