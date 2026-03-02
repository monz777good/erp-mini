// src/app/api/auth/login/route.ts
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
  const role = String(body?.role ?? "SALES").toUpperCase(); // (지금 로직 유지)

  if (!name || phone.length < 8) {
    return NextResponse.json({ message: "이름/전화번호 확인" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name, role: role === "ADMIN" ? "ADMIN" : "SALES" },
    create: { name, phone, role: role === "ADMIN" ? "ADMIN" : "SALES" },
  });

  // ✅ 핵심: 응답 객체(res)에 쿠키를 박아야 Vercel에서도 안 튕김
  const res = NextResponse.json({ ok: true, role: user.role });

  setSessionUser(res, {
    id: user.id,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "SALES",
  });

  return res;
}