import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { setSessionUser } from "@/lib/session";

export const runtime = "nodejs"; // ✅ Prisma + node crypto 때문에 필수

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
    const wantedRole = normRole(body?.role ?? body?.mode ?? body?.userType);

    if (!name || !phone || !pin) {
      return NextResponse.json({ ok: false, message: "필수값 누락" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, role: true, loginPinHash: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "로그인 실패 (정보 확인)" }, { status: 401 });
    }

    if (String(user.name ?? "").trim() !== name) {
      return NextResponse.json({ ok: false, message: "로그인 실패 (정보 확인)" }, { status: 401 });
    }

    if (wantedRole === "ADMIN" || wantedRole === "SALES") {
      const dbRole = String(user.role ?? "").trim().toUpperCase();
      if (dbRole !== wantedRole) {
        return NextResponse.json({ ok: false, message: "로그인 실패 (권한 선택 확인)" }, { status: 401 });
      }
    }

    const inputHash = sha256Hex(pin).toLowerCase();
    const dbHash = String(user.loginPinHash ?? "").trim().toLowerCase();

    if (!dbHash || inputHash !== dbHash) {
      return NextResponse.json({ ok: false, message: "로그인 실패 (PIN 확인)" }, { status: 401 });
    }

    // ✅ 여기서 반드시 Response에 쿠키를 심어야 함
    const res = NextResponse.json({ ok: true, role: user.role });
    await setSessionUser(res, { id: user.id, name: user.name, phone: user.phone, role: user.role });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}
