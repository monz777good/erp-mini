import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { ok: false, message: "전화번호가 필요합니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // ✅ PIN 없이 일단 로그인 성공 처리
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}