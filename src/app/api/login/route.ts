// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  const phone = digitsOnly(body?.phone ?? "");
  const role = String(body?.role ?? "SALES").toUpperCase();
  const remember = !!body?.remember || !!body?.autoLogin; // 둘 중 뭐가 오든 처리

  if (!name || phone.length < 8) {
    return NextResponse.json({ message: "이름/전화번호 확인" }, { status: 400 });
  }

  // ✅ 유저 upsert
  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, role: role === "ADMIN" ? "ADMIN" : "SALES" },
    create: { name, phone, role: role === "ADMIN" ? "ADMIN" : "SALES" },
  });

  // ✅ 세션 저장 (인자 2개만!)
  await setSessionUser(
    { id: user.id, name: user.name, role: String(user.role).toUpperCase() === "ADMIN" ? "ADMIN" : "SALES" },
    { remember }
  );

  return NextResponse.json({ ok: true });
}