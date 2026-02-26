import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getSessionUser } from "@/lib/session";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}
function sha256(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser(req as any);
    if (!me || !isAdmin(me.role)) {
      return NextResponse.json({ ok: false, message: "관리자만 가능" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId ?? "");
    const pin = digitsOnly(body?.pin);

    if (!userId) return NextResponse.json({ ok: false, message: "userId 필요" }, { status: 400 });
    if (pin.length !== 6) return NextResponse.json({ ok: false, message: "PIN은 숫자 6자리" }, { status: 400 });

    await prisma.user.update({
      where: { id: userId },
      data: { loginPinHash: sha256(pin) },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: String(e?.message ?? e) }, { status: 500 });
  }
}