import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // ✅ 승인/대기 상관없이 송장 찍으면 완료로 보냄 (기존 동작 그대로)
    await prisma.order.update({
      where: { id },
      data: { status: "DONE" as any },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}