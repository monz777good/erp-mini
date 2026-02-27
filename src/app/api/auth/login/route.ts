import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";

function getSecret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD is missing");
  return s;
}

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeToken(payloadObj: any) {
  const payload = Buffer.from(JSON.stringify(payloadObj));
  const payloadB64 = base64url(payload);
  const sig = crypto.createHmac("sha256", getSecret()).update(payloadB64).digest();
  const sigB64 = base64url(sig);
  return `${payloadB64}.${sigB64}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const phone = String(body?.phone ?? "").trim();
    const remember = !!body?.remember; // ✅ 자동로그인
    if (!phone) {
      return NextResponse.json({ ok: false, message: "전화번호가 필요합니다." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "등록되지 않은 사용자입니다." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, user });

    const token = makeToken({
      id: user.id,
      name: user.name,
      role: String(user.role),
    });

    // ✅ remember면 30일 / 아니면 세션쿠키(브라우저 닫으면 만료)
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}), // ✅ 핵심
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}