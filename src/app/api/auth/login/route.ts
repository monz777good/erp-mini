// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveSessionUser } from "@/lib/session";
import { hashPin, verifyPin } from "@/lib/pin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const mode = String(body?.mode ?? "SALES").toUpperCase(); // "SALES" | "ADMIN"
    const phone = digitsOnly(body?.phone);
    const pin = String(body?.pin ?? "").trim();
    const name = String(body?.name ?? "").trim(); // 화면에 항상 보여도 OK

    if (!phone || phone.length < 8) {
      return NextResponse.json({ ok: false, message: "전화번호 확인" }, { status: 400 });
    }
    if (!pin) {
      return NextResponse.json({ ok: false, message: "PIN을 입력하세요." }, { status: 400 });
    }

    const redirect = mode === "ADMIN" ? "/admin/orders" : "/orders";

    // 1) 기존 유저 조회
    const user = await prisma.user.findUnique({ where: { phone } });

    // 2) 유저 없으면 → SALES 모드에서만 신규 등록 허용(관리자 자동생성 금지)
    if (!user) {
      if (mode === "ADMIN") {
        return NextResponse.json(
          { ok: false, message: "관리자 계정이 아닙니다." },
          { status: 401 }
        );
      }

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

      const res = NextResponse.json({ ok: true, redirect, created: true });
      await saveSessionUser(res, {
        id: created.id,
        name: created.name,
        role: "SALES",
      });
      return res;
    }

    // 3) ADMIN 모드면 role이 ADMIN이어야 함
    const roleUpper = String(user.role).toUpperCase();
    const isAdmin = roleUpper === "ADMIN";

    if (mode === "ADMIN" && !isAdmin) {
      return NextResponse.json(
        { ok: false, message: "관리자 계정이 아닙니다." },
        { status: 401 }
      );
    }

    // 4) PIN 검증
    const ok = verifyPin(pin, (user as any).pin ?? null);
    if (!ok) {
      return NextResponse.json({ ok: false, message: "PIN이 올바르지 않습니다." }, { status: 401 });
    }

    // 5) (선택) 이름이 들어오면 최신으로 업데이트(영업/관리자 둘 다 편의)
    if (name && name !== user.name) {
      await prisma.user.update({ where: { id: user.id }, data: { name } });
    }

    const res = NextResponse.json({ ok: true, redirect, created: false });

    // ✅ 세션에는 "실제 role"을 담는다.
    await saveSessionUser(res, {
      id: user.id,
      name: name || user.name,
      role: isAdmin ? "ADMIN" : "SALES",
    });

    return res;
  } catch (e: any) {
    console.error("[auth/login]", e);
    return NextResponse.json({ ok: false, message: e?.message ?? "서버 오류" }, { status: 500 });
  }
}