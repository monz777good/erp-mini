import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIE = "erp_session";

function getSecret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD is not set (Vercel Env)");
  return s;
}

function toBase64Url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(payloadB64: string) {
  const secret = getSecret();
  return toBase64Url(
    crypto.createHmac("sha256", secret).update(payloadB64).digest()
  );
}

function encodeSession(user: { id: string; name: string; role: string }) {
  const payload = JSON.stringify({
    id: user.id,
    name: user.name,
    role: user.role,
    iat: Date.now(),
  });
  const payloadB64 = toBase64Url(Buffer.from(payload, "utf8"));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? "").trim();
    const pin = String(body?.pin ?? "").trim(); // 필요하면 나중에 사용

    if (!phone) {
      return NextResponse.json(
        { ok: false, message: "전화번호가 필요합니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, role: true, pin: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "등록되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // (선택) 관리자 PIN 검사하고 싶으면 아래 주석 해제
    // if (String(user.role).toUpperCase() === "ADMIN") {
    //   if (!pin || String(user.pin ?? "") !== pin) {
    //     return NextResponse.json(
    //       { ok: false, message: "PIN이 올바르지 않습니다." },
    //       { status: 401 }
    //     );
    //   }
    // }

    const token = encodeSession({
      id: user.id,
      name: user.name,
      role: String(user.role ?? "SALES"),
    });

    // ✅ 여기서 “응답 객체에” 쿠키를 박아버리면 100% 저장됨
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true, // ✅ Vercel(HTTPS)에서는 무조건 true로 고정
    });

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}