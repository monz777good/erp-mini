// src/app/api/orders/[id]/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Next.js params Promise 대응
type Ctx = { params: Promise<{ id: string }> };

function asOrderStatus(v: any): OrderStatus | null {
  const s = String(v ?? "").trim().toUpperCase();

  // 혹시 프론트에서 한글로 보내는 경우까지 방어
  if (s === "대기" || s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "승인" || s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "거절" || s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "출고완료" || s === "DONE") return OrderStatus.DONE;

  return null;
}

export async function POST(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const next = asOrderStatus(body?.status);

    if (!next) {
      return NextResponse.json(
        { ok: false, message: "status 값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: next },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, message: "상태 변경 서버 오류" },
      { status: 500 }
    );
  }
}