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

    const name = String(body?.name || "").trim();
    const phone = normalizePhone(String(body?.phone || ""));
    const pin = String(body?.pin || "").trim();

    if (!name || !phone || !pin) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const hashed = hashPin(pin);

    const existing = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        role: true,
        pin: true,
        name: true,
        phone: true,
      },
    });

    // 등록된 번호만 로그인 가능
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 영업사원만 이 API로 로그인 가능
    if (existing.role !== "SALES") {
      return NextResponse.json(
        { ok: false, error: "NOT_SALES_ACCOUNT" },
        { status: 403 }
      );
    }

    // PIN 미등록 계정 차단
    if (!existing.pin) {
      return NextResponse.json(
        { ok: false, error: "PIN_NOT_SET" },
        { status: 403 }
      );
    }

    // PIN 불일치 차단
    if (existing.pin !== hashed) {
      return NextResponse.json(
        { ok: false, error: "BAD_PIN" },
        { status: 401 }
      );
    }

    // 기존 동작 최대한 유지: 이름만 최신화
    if (name && existing.name !== name) {
      await prisma.user.update({
        where: { phone },
        data: { name },
      });
    }

    await setSessionUser({
      id: existing.id,
      role: existing.role,
      name: name || existing.name || "",
      phone: existing.phone || phone,
    });

    return NextResponse.json({
      ok: true,
      role: existing.role,
    });
  } catch (error) {
    console.error("SALES_LOGIN_ROUTE_ERROR", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}