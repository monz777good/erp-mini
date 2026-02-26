import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdCookie } from "@/lib/session";

export async function GET(req: Request) {
  try {
    // ✅ 핵심: Promise<string|null> 이라서 반드시 await
    const userId = await getUserIdCookie(req);

    if (!userId) {
      return NextResponse.json({ ok: true, user: null });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: true, user: null });
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}