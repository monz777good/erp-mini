import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveSessionUser } from "@/lib/session";
import crypto from "crypto";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name || "").trim();
  const phone = digitsOnly(String(body?.phone || ""));
  const pin = String(body?.pin || "").trim();

  if (!name || !phone || !pin) {
    return NextResponse.json({ message: "name/phone/pin required" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ message: "pin must be 6 digits" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { phone, role: "SALES" },
  });

  if (!user) {
    return NextResponse.json({ message: "등록되지 않은 영업사원입니다." }, { status: 401 });
  }

  if (!user.loginPinHash) {
    return NextResponse.json({ message: "PIN이 아직 설정되지 않았습니다." }, { status: 401 });
  }

  const pinHash = sha256Hex(pin);
  if (pinHash !== user.loginPinHash) {
    return NextResponse.json({ message: "PIN이 틀렸습니다." }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
  });

  await saveSessionUser(res as any, {
    id: user.id,
    name: user.name,
    role: "SALES",
  });

  return res;
}