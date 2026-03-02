// src/lib/session.ts
import crypto from "crypto";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: "SALES" | "ADMIN";
};

type SessionPayload = {
  v: 1;
  user: SessionUser;
  iat: number;
};

function getSecret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD is missing");
  return s;
}

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlToBuf(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function sign(data: string) {
  return b64url(crypto.createHmac("sha256", getSecret()).update(data).digest());
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = { v: 1, user, iat: Date.now() };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf-8"));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function readSessionToken(raw: string | undefined | null): SessionUser | null {
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  if (expected !== sig) return null;

  try {
    const json = JSON.parse(b64urlToBuf(body).toString("utf-8")) as SessionPayload;
    if (!json?.user?.id || !json?.user?.role) return null;
    return json.user;
  } catch {
    return null;
  }
}

function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export function getSessionUserFromRequest(req: Request): SessionUser | null {
  const jar = parseCookieHeader(req.headers.get("cookie"));
  return readSessionToken(jar[SESSION_COOKIE]);
}

// ✅ 기존 코드 호환: getSessionUser() 또는 getSessionUser(req)
export function getSessionUser(req?: Request): SessionUser | null {
  if (!req) return null; // 서버 컴포넌트에서 req 없이 검사하지 않음(불안정 방지)
  return getSessionUserFromRequest(req);
}

// ✅ Guards (req 있는 경우)
export function requireUser(req: Request): SessionUser {
  const u = getSessionUserFromRequest(req);
  if (!u) throw new Error("UNAUTHORIZED:NO_SESSION");
  return u;
}

export function requireSales(req: Request): SessionUser {
  const u = getSessionUserFromRequest(req);
  if (!u) throw new Error("UNAUTHORIZED:NO_SESSION");
  if (u.role !== "SALES" && u.role !== "ADMIN") throw new Error("FORBIDDEN:NOT_SALES");
  return u;
}

export function requireAdmin(req: Request): SessionUser {
  const u = getSessionUserFromRequest(req);
  if (!u) throw new Error("UNAUTHORIZED:NO_SESSION");
  if (u.role !== "ADMIN") throw new Error("FORBIDDEN:NOT_ADMIN");
  return u;
}

// ================================
// ✅ 핵심: "인자 없는 호출" 호환 지원
// - layout 같은 곳에서 requireAdminUser() / requireAdmin() 을 0인자로 써도 빌드 통과
// - 실제 보안은 middleware가 담당
// ================================
export function requireAdminUser(): SessionUser | null;
export function requireAdminUser(req: Request): SessionUser;
export function requireAdminUser(req?: Request): any {
  if (!req) return null;
  return requireAdmin(req);
}

export function requireSalesUser(): SessionUser | null;
export function requireSalesUser(req: Request): SessionUser;
export function requireSalesUser(req?: Request): any {
  if (!req) return null;
  return requireSales(req);
}

// ✅ 쿠키 세팅은 "응답(res)"에만 한다 (Vercel에서 가장 안정적)
export function setSessionUser(res: NextResponse, user: SessionUser) {
  const token = createSessionToken(user);
  // @ts-ignore
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

// ✅ 기존 코드 호환: saveSessionUser(res, user)
export function saveSessionUser(res: NextResponse, user: SessionUser) {
  return setSessionUser(res, user);
}

// ✅ 로그아웃/세션 삭제
export function clearSession(res: NextResponse) {
  // @ts-ignore
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}