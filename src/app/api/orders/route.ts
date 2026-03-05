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
  // ✅ 세션 유저 확인
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // ✅ 쿼리 파라미터(필터)
  const url = new URL(req.url);
  const status = asOrderStatus(url.searchParams.get("status"));
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to = url.searchParams.get("to"); // YYYY-MM-DD

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

  // ✅ ADMIN은 전체, SALES는 본인 것만
  if (user.role !== Role.ADMIN) {
    where.userId = user.id;
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      item: true,
      user: { select: { id: true, name: true, phone: true, role: true } },
    },
  });

  // ✅ 프론트 호환: rows + orders 둘 다 내려줌
  return NextResponse.json({
    ok: true,
    rows,
    orders: rows,
  });
}