import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function onlyNumber(v: string) {
  return String(v ?? "").replace(/[^\d]/g, "");
}

function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER ?? "";
  return crypto.createHash("sha256").update(`${pin}:${pepper}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const role = String(body?.role ?? "SALES").toUpperCase();
    const phone = onlyNumber(body?.phone ?? "");
    const pin = String(body?.pin ?? "").trim();

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, error: "PHONE_PIN_REQUIRED" },
        { status: 400 }
      );
    }

    if (role !== "SALES" && role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "INVALID_ROLE" },
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
        pin: true,
      },
    });

    // ✅ 없는 유저 자동 생성 금지
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ✅ 역할 일치 확인
    if (role === "ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "NOT_ADMIN" },
        { status: 403 }
      );
    }

    if (role === "SALES" && user.role !== "SALES") {
      return NextResponse.json(
        { ok: false, error: "NOT_SALES" },
        { status: 403 }
      );
    }

    // ✅ PIN 자동 설정 금지
    if (!user.pin) {
      return NextResponse.json(
        { ok: false, error: "PIN_NOT_SET" },
        { status: 403 }
      );
    }

    const hashed = hashPin(pin);

    if (user.pin !== hashed) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PIN" },
        { status: 401 }
      );
    }

    await setSessionUser({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role as any,
    });

    return NextResponse.json({ ok: true, created: false, role: user.role });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}