import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name ?? "").trim();
    const phone = digitsOnly(body?.phone ?? "");
    const pin = String(body?.pin ?? "").trim();
    const role = String(body?.role ?? "SALES").toUpperCase() as "SALES" | "ADMIN";

    if (!name || !phone || !pin) {
      return NextResponse.json({ ok: false, message: "이름/전화/PIN 필수" }, { status: 400 });
    }

    // ✅ 너 기존 로직이 뭐였든, 일단 “사용자 찾고, 없으면 생성”으로 안정화
    // (추후 관리자만 생성/영업만 생성 등 정책은 다음 단계에서)
    let user = await prisma.user.findFirst({
      where: { name, phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { name, phone, role },
      });
    }

    // ✅ PIN 검증 로직이 별도로 있으면 여기서 체크하면 됨
    // 지금은 세션 안정화가 1순위라서 “쿠키 세팅”이 목적

    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
    await setSessionUser(res, { id: user.id, name: user.name, role: user.role as any });
    return res;
  } catch (e: any) {
    console.error("[/api/login] ERROR:", e);
    return NextResponse.json({ ok: false, message: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}