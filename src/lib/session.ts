import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: "SALES" | "ADMIN" | string;
};

function getSecret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD is not set in .env");
  return s;
}

function toBase64Url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(str: string) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return Buffer.from(b64 + pad, "base64");
}

function sign(payloadB64: string) {
  const secret = getSecret();
  return toBase64Url(
    crypto.createHmac("sha256", secret).update(payloadB64).digest()
  );
}

function encodeSession(user: SessionUser) {
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

function decodeSession(token: string): SessionUser | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;

    const expected = sign(payloadB64);
    if (expected !== sig) return null;

    const payload = JSON.parse(fromBase64Url(payloadB64).toString("utf8"));
    if (!payload?.id) return null;

    return {
      id: String(payload.id),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "SALES"),
    };
  } catch {
    return null;
  }
}

/**
 * ✅ 쿠키 옵션 (배포에서도 저장되게)
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30일
  };
}

/**
 * ✅ (추가) Route Handler에서 NextResponse.cookies.set으로 확실히 심기 위한 토큰 생성기
 */
export function createSessionToken(user: SessionUser) {
  return encodeSession(user);
}

/**
 * ✅ Next 최신 대응
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar: any = await (cookies() as any); // next 버전차 대응
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function saveSessionUser(user: SessionUser) {
  const jar: any = await (cookies() as any);
  const value = encodeSession(user);

  jar.set(SESSION_COOKIE, value, getSessionCookieOptions());
}

export async function clearSession() {
  const jar: any = await (cookies() as any);
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * ✅ API Route에서 쓰는 가드 함수들
 */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json(
      { ok: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json(
      { ok: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  if (String(user.role).toUpperCase() !== "ADMIN") {
    return NextResponse.json(
      { ok: false, message: "FORBIDDEN" },
      { status: 403 }
    );
  }
  return user;
}