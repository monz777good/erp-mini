import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function handler(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const orderIds: string[] = body?.orderIds;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: "orderIds가 비어있음" },
        { status: 400 }
      );
    }

    // ✅ PENDING/REQUESTED/APPROVED 중 있는 것만 DONE으로
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        status: { in: ["PENDING", "REQUESTED", "APPROVED"] },
      },
      data: { status: "DONE" },
    });

    return NextResponse.json({ ok: true, updatedCount: result.count });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "서버 오류" },
      { status: 500 }
    );
  }
}

export const POST = handler;
export const PATCH = handler;
