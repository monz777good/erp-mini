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
 * ✅ Next 최신(비동기 cookies) 대응
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function saveSessionUser(user: SessionUser) {
  const jar = await cookies();
  const value = encodeSession(user);

  jar.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * ✅ API Route에서 쓰는 가드 함수들 (기존 코드 호환용)
 * - requireUser(): 로그인 필요
 * - requireAdmin(): 관리자 필요
 *
 * 사용 예)
 * const user = await requireAdmin();
 * if (user instanceof NextResponse) return user;
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