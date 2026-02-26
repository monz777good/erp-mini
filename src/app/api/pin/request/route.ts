import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function makePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const phone = digitsOnly(body?.phone);

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, message: "NAME_PHONE_REQUIRED" },
        { status: 400 }
      );
    }

    // =========================
    // ✅ 유저 없으면 자동 생성
    // =========================
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          phone,
          role: "SALES",
        },
      });
    } else {
      // 이름 바뀌면 업데이트 (선택)
      if (user.name !== name) {
        user = await prisma.user.update({
          where: { phone },
          data: { name },
        });
      }
    }

    // =========================
    // PIN 생성
    // =========================
    const pin = makePin();
    const hash = crypto.createHash("sha256").update(pin).digest("hex");

    await prisma.dailyPin.upsert({
      where: {
        userId_dateKey: {
          userId: user.id,
          dateKey: todayKey(),
        },
      },
      update: {
        pinHash: hash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        usedAt: null,
      },
      create: {
        userId: user.id,
        dateKey: todayKey(),
        pinHash: hash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json({
      ok: true,
      pin,
      message: "PIN_ISSUED",
    });

  } catch (e) {
    console.error("PIN_REQUEST_ERROR", e);
    return NextResponse.json(
      { ok: false, message: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}