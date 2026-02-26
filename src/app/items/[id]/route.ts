import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Next.js 15: params가 Promise로 들어올 수 있어서 await 처리
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    // (혹시 이 라우트를 실제로 쓰고 있다면 안전장치)
    const used = await prisma.order.count({ where: { itemId: id } });
    if (used > 0) {
      return NextResponse.json(
        { ok: false, message: "이 품목으로 주문이 있어 삭제할 수 없습니다." },
        { status: 409 }
      );
    }

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}