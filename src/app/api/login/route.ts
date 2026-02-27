import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? "").trim();

    if (!phone) {
      return NextResponse.json(
        { ok: false, message: "전화번호가 필요합니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "등록되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // ✅ 응답 객체를 먼저 만들고
    const res = NextResponse.json({
      ok: true,
      user,
    });

    // ✅ 여기에 쿠키를 "확실하게" 박는다 (핵심)
    await saveSessionUser(
      { id: user.id, name: user.name, role: String(user.role) },
      res
    );

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}