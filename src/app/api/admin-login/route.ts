import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER || "";
  return crypto.createHash("sha256").update(`${pin}:${pepper}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const phone = String(body.phone || "").trim();
    const pin = String(body.pin || "").trim();

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, role: true, pin: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "NOT_ADMIN" }, { status: 403 });
    }

    const hashed = hashPin(pin);
    if (!user.pin || user.pin !== hashed) {
      return NextResponse.json({ ok: false, error: "BAD_PIN" }, { status: 401 });
    }

    // ✅ name은 DB에 저장된 값 사용 (입력 받을 필요 없음)
    setSession({ id: user.id, role: user.role, name: user.name || "" });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}