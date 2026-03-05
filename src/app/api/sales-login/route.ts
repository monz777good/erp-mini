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

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const pin = String(body.pin || "").trim();

    if (!name || !phone || !pin) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const hashed = hashPin(pin);

    // ✅ 기존 유저 있으면: PIN 검증 후 로그인
    const existing = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, role: true, pin: true, name: true },
    });

    if (existing) {
      // PIN이 비어있으면(초기 유저) → 최초 로그인으로 PIN 세팅 허용 (SALES만)
      if (!existing.pin) {
        // ADMIN에 pin이 비어있으면 위험하니 막음
        if (existing.role === "ADMIN") {
          return NextResponse.json(
            { ok: false, error: "ADMIN_PIN_NOT_SET" },
            { status: 403 }
          );
        }

        const updated = await prisma.user.update({
          where: { phone },
          data: { pin: hashed, name },
          select: { id: true, role: true, name: true },
        });

        setSession({ id: updated.id, role: updated.role, name: updated.name || "" });
        return NextResponse.json({ ok: true, role: updated.role });
      }

      // 일반 로그인: pin 검증
      if (existing.pin !== hashed) {
        return NextResponse.json({ ok: false, error: "BAD_PIN" }, { status: 401 });
      }

      // 영업사원은 이름 최신화 (관리자는 여기로 로그인하는 경우 거의 없지만, 들어와도 name은 덮지 않음)
      if (existing.role === "SALES" && existing.name !== name) {
        await prisma.user.update({ where: { phone }, data: { name } });
      }

      setSession({ id: existing.id, role: existing.role, name: existing.name || name });
      return NextResponse.json({ ok: true, role: existing.role });
    }

    // ✅ 유저 없으면: 영업사원 최초 등록
    const created = await prisma.user.create({
      data: {
        name,
        phone,
        role: "SALES",
        pin: hashed,
      },
      select: { id: true, role: true, name: true },
    });

    setSession({ id: created.id, role: created.role, name: created.name || "" });
    return NextResponse.json({ ok: true, role: created.role });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}