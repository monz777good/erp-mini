import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER ?? "";
  return crypto.createHash("sha256").update(`${pin}:${pepper}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? "").trim();
    const pin = String(body?.pin ?? "").trim();

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, error: "PHONE_PIN_REQUIRED" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, role: true, pin: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "NOT_ADMIN" },
        { status: 403 }
      );
    }

    const hashed = hashPin(pin);

    // ✅ pin이 DB에 없으면(초기상태) -> 첫 로그인 pin 설정
    if (!user.pin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pin: hashed },
      });
    } else {
      // ✅ pin이 있으면 검증
      if (user.pin !== hashed) {
        return NextResponse.json(
          { ok: false, error: "INVALID_PIN" },
          { status: 401 }
        );
      }
    }

    // ✅ 여기서 phone까지 포함해서 세션 저장 (타입에러 해결)
    await setSessionUser({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role as any,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}