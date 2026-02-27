// ✅ 경로: src/lib/session.ts
import crypto from "crypto";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: string; // "ADMIN" | "SALES"
};

function getSecret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) {
    // Vercel 환경변수 안 들어오면 100% 여기서 터져야 원인 파악이 됨
    throw new Error("SESSION_PASSWORD is missing (Vercel env not set).");
  }
  return s;
}

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(payloadB64: string) {
  const secret = getSecret();
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  return base64url(sig);
}

function makeToken(user: SessionUser) {
  const payload = base64url(JSON.stringify(user));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function verifyToken(token: string): SessionUser | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  // timingSafeEqual 사용(길이 다르면 에러나서 방어)
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const data = JSON.parse(json);
    if (!data?.id || !data?.name || !data?.role) return null;
    return { id: String(data.id), name: String(data.name), role: String(data.role) };
  } catch {
    return null;
  }
}

function readCookieFromReq(req: Request, name: string) {
  const raw = req.headers.get("cookie") || "";
  const parts = raw.split(";").map((v) => v.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx < 0) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

/**
 * ✅ Route Handler에서 "반드시" 이렇게 써야 쿠키가 브라우저에 심긴다.
 * res.cookies.set(...) 으로 Response에 붙여서 내보내는 방식.
 */
export function setSessionUser(res: NextResponse, user: SessionUser) {
  const token = makeToken(user);

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // vercel은 production이므로 secure=true
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

export function clearSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionUser(req: Request): SessionUser | null {
  const token = readCookieFromReq(req, SESSION_COOKIE);
  if (!token) return null;
  return verifyToken(token);
}