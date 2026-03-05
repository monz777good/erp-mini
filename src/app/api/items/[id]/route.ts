import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

//  Next.js 15   : params Promise   
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = await req.json().catch(() => ({}));
    const name = String((body as any).name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { ok: false, message: " ." },
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
        { ok: false, message: "  ." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, message: " " }, { status: 500 });
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
        { ok: false, message: "      ." },
        { status: 409 }
      );
    }

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: " " }, { status: 500 });
  }
}