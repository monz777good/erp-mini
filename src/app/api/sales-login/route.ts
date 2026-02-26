import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? "").trim();

    if (!phone) {
      return NextResponse.json(
        { ok: false, message: "영업사원 전화번호가 필요합니다." },
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
        { ok: false, message: "등록되지 않은 영업사원입니다." },
        { status: 401 }
      );
    }

    if (String(user.role).toUpperCase() !== "SALES") {
      return NextResponse.json(
        { ok: false, message: "영업사원 계정이 아닙니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}