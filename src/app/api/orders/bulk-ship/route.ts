import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ✅ 선택한 주문들을 "DONE(출고완료)"로 일괄 변경
// - REQUESTED(대기/요청) 또는 APPROVED(승인) 상태만 대상
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderIds = Array.isArray(body?.orderIds) ? body.orderIds : [];

    if (orderIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: "orderIds가 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ PENDING 같은 옛 상태값 제거
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        status: { in: ["REQUESTED", "APPROVED"] }, // ✅ schema.prisma의 OrderStatus에 맞춤
      },
      data: { status: "DONE" },
    });

    return NextResponse.json({ ok: true, updatedCount: result.count });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}