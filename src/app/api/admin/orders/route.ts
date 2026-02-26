import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";

function asOrderStatus(v: any): OrderStatus | null {
  const s = String(v ?? "").toUpperCase();
  if (s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "DONE") return OrderStatus.DONE;
  return null;
}

// ✅ GET: 관리자 주문 목록
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status")?.trim() || "";
  const status = asOrderStatus(statusParam);

  // (from/to/q는 너가 기존에 쓰던 버전이 따로 있으면 나중에 합치자)
  const where: any = {};
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      item: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, bizRegNo: true } }, // ✅ 요양기관번호용
    },
  });

  return NextResponse.json({ ok: true, orders });
}

// ✅ PATCH: 상태 변경 (승인/거절/출고완료)
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  const next = asOrderStatus(body?.status);

  if (!id) {
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  }
  if (!next) {
    return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: next },
  });

  return NextResponse.json({ ok: true, order: updated });
}