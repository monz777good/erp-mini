import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER || "";
  return crypto.createHash("sha256").update(`${pin}:${pepper}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const pin = String(body.pin || "").trim();

  if (!name || !phone || !pin) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const hashed = hashPin(pin);

  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, role: true, pin: true, name: true, phone: true },
  });

  // ✅ 있으면: PIN 검증
  if (existing) {
    if (!existing.pin) {
      // 기존 유저인데 pin이 비어있으면(초기) → SALES면 최초 로그인으로 세팅
      if (existing.role === "ADMIN") {
        return NextResponse.json({ ok: false, error: "ADMIN_PIN_NOT_SET" }, { status: 403 });
      }
      const updated = await prisma.user.update({
        where: { phone },
        data: { pin: hashed, name },
        select: { id: true, role: true, name: true, phone: true },
      });

      await setSessionUser({
        id: updated.id,
        role: updated.role as any,
        name: updated.name,
        phone: updated.phone,
      });

      return NextResponse.json({ ok: true, role: updated.role });
    }

    if (existing.pin !== hashed) {
      return NextResponse.json({ ok: false, error: "BAD_PIN" }, { status: 401 });
    }

    // SALES면 이름 최신화
    if (existing.role === "SALES" && existing.name !== name) {
      await prisma.user.update({ where: { phone }, data: { name } });
    }

    await setSessionUser({
      id: existing.id,
      role: existing.role as any,
      name: existing.name ?? name,
      phone: existing.phone ?? phone,
    });

    return NextResponse.json({ ok: true, role: existing.role });
  }

  // ✅ 없으면: 영업사원 최초 등록
  const created = await prisma.user.create({
    data: { name, phone, role: "SALES", pin: hashed },
    select: { id: true, role: true, name: true, phone: true },
  });

  await setSessionUser({
    id: created.id,
    role: created.role as any,
    name: created.name,
    phone: created.phone,
  });

  return NextResponse.json({ ok: true, role: created.role });
}