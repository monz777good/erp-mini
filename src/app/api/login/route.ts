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

    // ✅ 핵심: 세션 쿠키 저장 (이게 있어야 /api/me OK + 관리자 권한 OK)
    await saveSessionUser({
      id: user.id,
      name: user.name,
      role: String(user.role),
    });

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}