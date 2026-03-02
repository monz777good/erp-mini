import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveSessionUser } from "@/lib/session";
import { hashPin, verifyPin } from "@/lib/pin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name ?? "").trim();
    const phone = digitsOnly(body?.phone);
    const pin = String(body?.pin ?? "").trim();

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, message: "전화번호와 PIN을 입력하세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    // ✅ 1) 유저가 없으면 "SALES만" 첫 등록 허용 (관리자 자동생성 금지)
    if (!user) {
      if (!name) {
        return NextResponse.json(
          { ok: false, message: "처음 등록은 이름이 필요합니다." },
          { status: 400 }
        );
      }

      const created = await prisma.user.create({
        data: {
          name,
          phone,
          role: "SALES",
          pin: hashPin(pin),
        },
      });

      // ✅ 응답 먼저 만들고 → 그 응답에 쿠키 심기
      const res = NextResponse.json({ ok: true, created: true });

      // ✅ saveSessionUser는 (res, user) 2개 인자
      await saveSessionUser(res, {
        id: created.id,
        name: created.name,
        role: String(created.role).toUpperCase() === "ADMIN" ? "ADMIN" : "SALES",
      });

      return res;
    }

    // ✅ 2) 유저가 있으면 PIN 검증
    const ok = verifyPin(pin, user.pin ?? null);
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "PIN이 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // ✅ 응답 먼저 만들고 → 그 응답에 쿠키 심기
    const res = NextResponse.json({ ok: true, created: false });

    await saveSessionUser(res, {
      id: user.id,
      name: user.name,
      role: String(user.role).toUpperCase() === "ADMIN" ? "ADMIN" : "SALES",
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}