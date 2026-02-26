import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { setSessionUser } from "@/lib/session";

export const runtime = "nodejs";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function normPhone(v: any) {
  return String(v ?? "").replace(/\D/g, "").trim();
}

function normPin(v: any) {
  return String(v ?? "").replace(/\s+/g, "").trim();
}

function normRole(v: any) {
  const s = String(v ?? "").trim().toUpperCase();
  if (s.includes("ADMIN") || s.includes("관리")) return "ADMIN";
  if (s.includes("SALES") || s.includes("영업")) return "SALES";
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const name = String(body?.name ?? "").trim();
    const phone = normPhone(body?.phone);
    const pin = normPin(body?.pin);
    const wantedRole = normRole(body?.role ?? body?.mode);

    if (!name || !phone || !pin) {
      return NextResponse.json(
        { ok: false, message: "필수값 누락" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "로그인 실패" }, { status: 401 });
    }

    if (user.name.trim() !== name) {
      return NextResponse.json({ ok: false, message: "로그인 실패" }, { status: 401 });
    }

    if (wantedRole === "ADMIN" || wantedRole === "SALES") {
      if (user.role.toUpperCase() !== wantedRole) {
        return NextResponse.json({ ok: false, message: "권한 선택 오류" }, { status: 401 });
      }
    }

    const inputHash = sha256Hex(pin);
    if (user.loginPinHash !== inputHash) {
      return NextResponse.json({ ok: false, message: "PIN 오류" }, { status: 401 });
    }

    // ✅ 반드시 response 먼저 생성
    const res = NextResponse.json({ ok: true, role: user.role });

    // ✅ response 넘겨야 함 (중요)
    await setSessionUser(res, {
      id: user.id,
      name: user.name,
      role: user.role,
    });

    return res;

  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}