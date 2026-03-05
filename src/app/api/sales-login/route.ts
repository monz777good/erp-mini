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
    const name = String(body?.name ?? "").trim();

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, error: "PHONE_PIN_REQUIRED" },
        { status: 400 }
      );
    }

    const hashed = hashPin(pin);

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, role: true, pin: true },
    });

    // ✅ 없으면 영업사원 자동 생성
    if (!user) {
      if (!name) {
        return NextResponse.json(
          { ok: false, error: "NAME_REQUIRED" },
          { status: 400 }
        );
      }

      const created = await prisma.user.create({
        data: {
          name,
          phone,
          role: "SALES" as any,
          pin: hashed,
        },
        select: { id: true, name: true, phone: true, role: true },
      });

      await setSessionUser({
        id: created.id,
        name: created.name,
        phone: created.phone,
        role: created.role as any,
      });

      return NextResponse.json({ ok: true, created: true });
    }

    // ✅ SALES만 허용
    if (user.role !== "SALES") {
      return NextResponse.json(
        { ok: false, error: "NOT_SALES" },
        { status: 403 }
      );
    }

    // ✅ pin 없으면 첫 로그인으로 설정, 있으면 검증
    if (!user.pin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pin: hashed },
      });
    } else {
      if (user.pin !== hashed) {
        return NextResponse.json(
          { ok: false, error: "INVALID_PIN" },
          { status: 401 }
        );
      }
    }

    // ✅ phone 포함 (빌드 에러 해결)
    await setSessionUser({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role as any,
    });

    return NextResponse.json({ ok: true, created: false });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}