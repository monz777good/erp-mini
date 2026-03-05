// src/app/api/orders/[id]/done-and-excel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const result = await prisma.$transaction(async (tx) => {
      // ✅ 주문 + 품목 bundleV/stockV 같이 읽기
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          quantity: true,
          itemId: true,
          item: { select: { id: true, bundleV: true, stockV: true } },
        },
      });

      if (!order) {
        return { ok: false, status: 404 as const, message: "주문을 찾을 수 없습니다." };
      }

      // ✅ 이미 DONE이면 재고 차감 2번 하면 안됨 (중복방지)
      if (order.status === "DONE") {
        return { ok: true, alreadyDone: true as const };
      }

      const bundleV = order.item?.bundleV ?? 1;
      const stockV = order.item?.stockV ?? 0;
      const qty = order.quantity ?? 0;

      // ✅ 차감량 = 주문수량 * 묶음(V)
      const deduct = Math.floor(qty) * Math.floor(bundleV);

      if (deduct < 0) {
        return { ok: false, status: 400 as const, message: "차감 수량이 올바르지 않습니다." };
      }

      if (stockV < deduct) {
        return {
          ok: false,
          status: 409 as const,
          message: `재고 부족: 현재 ${stockV}V, 필요 ${deduct}V`,
        };
      }

      // ✅ 재고 차감
      await tx.item.update({
        where: { id: order.itemId },
        data: { stockV: stockV - deduct },
      });

      // ✅ 주문 DONE 처리
      await tx.order.update({
        where: { id: order.id },
        data: { status: "DONE" as any },
      });

      return { ok: true, deductedV: deduct };
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}