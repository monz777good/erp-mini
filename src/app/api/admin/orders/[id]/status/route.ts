// src/app/api/admin/orders/[id]/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function asOrderStatus(v: any): OrderStatus | null {
  const s = String(v ?? "").toUpperCase().trim();
  if (s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "DONE") return OrderStatus.DONE;
  return null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 로그인이 필요합니다.", 401);

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const next = asOrderStatus(body?.status);

  if (!next) return err("status 값이 올바르지 않습니다.");

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: next },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    return err(e?.message ?? "상태 변경 실패", 400);
  }
}