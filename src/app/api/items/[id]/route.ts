import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Next.js 15 빌드 타입 대응: params가 Promise로 들어오는 케이스가 있음
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = await req.json().catch(() => ({}));
    const name = String((body as any).name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "품목명이 비어있습니다." },
        { status: 400 }
      );
    }

    const item = await prisma.item.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error(e);
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "이미 존재하는 품목명입니다." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const used = await prisma.order.count({
      where: { itemId: id },
    });

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