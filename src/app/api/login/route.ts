import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import { hashPin, verifyPin } from "@/lib/pin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

/**
 * 관리자 탭 로그인 전용
 * - ADMIN만 로그인 성공
 * - 성공 시 redirectTo: /admin/orders
 * - (선택) 최초 관리자 생성은 ADMIN_PIN으로만 허용
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const phone = digitsOnly(body?.phone);
    const pin = String(body?.pin ?? "").trim();
    const name = String(body?.name ?? "관리자").trim() || "관리자";

    if (!phone || phone.length < 8 || !pin) {
      return NextResponse.json({ ok: false, message: "전화번호와 PIN을 입력하세요." }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { phone } });

    // ✅ 유저가 없으면: "최초 관리자 생성"을 ADMIN_PIN으로만 허용(원치 않으면 이 블록 지워도 됨)
    if (!user) {
      const master = String(process.env.ADMIN_PIN ?? "").trim();
      if (!master || pin !== master) {
        return NextResponse.json(
          { ok: false, message: "관리자 계정이 없습니다. (최초 생성은 관리자 마스터 PIN 필요)" },
          { status: 401 }
        );
      }

      user = await prisma.user.create({
        data: {
          name,
          phone,
          role: "ADMIN",
          pin: hashPin(pin),
        },
      });

      const res = NextResponse.json({ ok: true, role: "ADMIN", redirectTo: "/admin/orders", created: true });

      await setSessionUser(res, {
        id: user.id,
        name: user.name,
        role: "ADMIN",
      });

      return res;
    }

    // ✅ ADMIN만 통과
    const role = String((user as any).role ?? "").toUpperCase();
    if (role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "관리자 계정이 아닙니다." }, { status: 403 });
    }

    // ✅ PIN 검증
    const ok = verifyPin(pin, (user as any).pin ?? null);
    if (!ok) {
      return NextResponse.json({ ok: false, message: "PIN이 올바르지 않습니다." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, role: "ADMIN", redirectTo: "/admin/orders", created: false });

    await setSessionUser(res, {
      id: user.id,
      name: user.name,
      role: "ADMIN",
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: String(e?.message ?? e) }, { status: 500 });
  }
}