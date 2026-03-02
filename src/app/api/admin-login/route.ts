import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveSessionUser } from "@/lib/session";
import { verifyPin } from "@/lib/pin";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const phone = digitsOnly(body.phone);
    const pin = String(body.pin ?? "");

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, code: "BAD_REQUEST", message: "전화번호와 PIN을 입력하세요." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "NO_USER", message: "사용자를 찾을 수 없습니다." },
        { status: 401 }
      );
    }

    // ✅ 관리자 로그인 화면: ADMIN만 허용
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, code: "FORBIDDEN", message: "관리자만 로그인 가능합니다." },
        { status: 403 }
      );
    }

    const ok = verifyPin(pin, (user as any).pin ?? null);
    if (!ok) {
      return NextResponse.json(
        { ok: false, code: "BAD_PIN", message: "PIN이 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // ✅ 핵심: 응답(res)에 쿠키를 세팅해야 Vercel에서 로그인 유지됨
    const res = NextResponse.json({ ok: true });
    saveSessionUser(res, { id: user.id, name: user.name, role: user.role as any });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}