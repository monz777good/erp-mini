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
 * 영업사원 탭 로그인
 * - SALES는 없으면 생성 허용
 * - ADMIN도 여기로 로그인 가능(= 영업 화면 진입용)
 * - 성공 시 redirectTo: /orders
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name ?? "").trim();
    const phone = digitsOnly(body?.phone);
    const pin = String(body?.pin ?? "").trim();

    if (!phone || phone.length < 8 || !pin) {
      return NextResponse.json({ ok: false, message: "전화번호와 PIN을 입력하세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    // ✅ 유저 없으면: SALES만 신규 생성 허용 (관리자 자동생성 금지)
    if (!user) {
      if (!name) {
        return NextResponse.json({ ok: false, message: "처음 등록은 이름이 필요합니다." }, { status: 400 });
      }

      const created = await prisma.user.create({
        data: {
          name,
          phone,
          role: "SALES",
          pin: hashPin(pin),
        },
      });

      const res = NextResponse.json({ ok: true, role: "SALES", redirectTo: "/orders", created: true });

      await setSessionUser(res, {
        id: created.id,
        name: created.name,
        role: "SALES",
      });

      return res;
    }

    // ✅ 유저 있으면 PIN 검증 (ADMIN이든 SALES든 동일)
    const ok = verifyPin(pin, (user as any).pin ?? null);
    if (!ok) {
      return NextResponse.json({ ok: false, message: "PIN이 올바르지 않습니다." }, { status: 401 });
    }

    const role = String((user as any).role ?? "").toUpperCase() === "ADMIN" ? "ADMIN" : "SALES";

    const res = NextResponse.json({ ok: true, role, redirectTo: "/orders", created: false });

    await setSessionUser(res, {
      id: user.id,
      name: user.name,
      role,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: String(e?.message ?? e) }, { status: 500 });
  }
}