import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name ?? "").trim();
    const phone = digitsOnly(body?.phone ?? "");
    const pin = String(body?.pin ?? "").trim();
    const role = String(body?.role ?? "SALES").toUpperCase() as "SALES" | "ADMIN";

    if (!name || !phone || !pin) {
      return NextResponse.json({ ok: false, message: "이름/전화/PIN 필수" }, { status: 400 });
    }

    let user = await prisma.user.findFirst({
      where: { name, phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { name, phone, role },
      });
    }

    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
    await setSessionUser(res, { id: user.id, name: user.name, role: user.role as any });
    return res;
  } catch (e: any) {
    console.error("[/api/auth/login] ERROR:", e);
    return NextResponse.json({ ok: false, message: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}