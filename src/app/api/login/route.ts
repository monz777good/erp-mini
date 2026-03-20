import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(v: string) {
  return String(v || "").replace(/\D/g, "");
}

function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER || "";
  return crypto.createHash("sha256").update(`${pin}:${pepper}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body.name || "").trim();
    const phone = normalizePhone(String(body.phone || ""));
    const pin = String(body.pin || "").trim();

    if (!name || !phone || !pin) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const hashed = hashPin(pin);

    const existing = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, role: true, pin: true, name: true, phone: true },
    });

    // ✅ 등록되지 않은 번호는 로그인 불가
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ✅ 관리자/영업사원 모두 PIN이 미등록이면 로그인 불가
    if (!existing.pin) {
      return NextResponse.json(
        { ok: false, error: "PIN_NOT_SET" },
        { status: 403 }
      );
    }

    // ✅ PIN 불일치면 로그인 불가
    if (existing.pin !== hashed) {
      return NextResponse.json(
        { ok: false, error: "BAD_PIN" },
        { status: 401 }
      );
    }

    // ✅ SALES만 이름 최신화 허용 (기존 동작 유지)
    if (existing.role === "SALES" && name && existing.name !== name) {
      await prisma.user.update({
        where: { phone },
        data: { name },
      });
    }

    const sessionUser = {
      id: existing.id,
      role: existing.role as any,
      name: existing.role === "SALES" && name ? name : (existing.name ?? name),
      phone: existing.phone ?? phone,
    };

    await setSessionUser(sessionUser);

    return NextResponse.json({
      ok: true,
      role: existing.role,
    });
  } catch (error) {
    console.error("LOGIN_ROUTE_ERROR", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}