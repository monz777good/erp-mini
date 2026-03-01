// src/lib/session.ts
import crypto from "crypto";
import { cookies } from "next/headers";
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

// -------------------------
// Cookie helpers (Next 16: cookies() 타입이 Promise일 수도 있어서 안전 처리)
// -------------------------
function getCookieValueFromNextCookies(): string | null {
  // Next 버전/타입에 따라 cookies()가 Promise로 타이핑되는 경우가 있음
  // 런타임에서도 Promise면 동기 접근 불가 → null 반환 (API에서는 req로 읽는 방식 사용)
  const c: any = (cookies as any)();
  if (!c) return null;
  if (typeof c.then === "function") return null; // Promise 케이스 방어
  if (typeof c.get !== "function") return null;
  return c.get(SESSION_COOKIE)?.value ?? null;
}

export function getSessionUserFromCookies(): SessionUser | null {
  const raw = getCookieValueFromNextCookies();
  return readSessionToken(raw);
}

export function setSessionCookie(token: string) {
  // set은 cookies() Promise 타입이더라도 런타임에서는 보통 동기 객체로 동작함
  // 타입 에러 방지를 위해 any 처리
  const c: any = (cookies as any)();
  if (c && typeof c.then !== "function" && typeof c.set === "function") {
    c.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return;
  }

  // fallback: cookies()가 Promise로만 존재하는 환경이면 여기서는 세팅 불가
  // (대부분 route handler에서는 NextResponse cookies로 세팅하므로 문제 없음)
}

export function clearSessionCookie() {
  const c: any = (cookies as any)();
  if (c && typeof c.then !== "function" && typeof c.set === "function") {
    c.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }
}

// -------------------------
// Request parsing (API/Route handlers에서 가장 안정적)
// -------------------------
function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;

  const parts = header.split(";");
  for (const part of parts) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export function getSessionUserFromRequest(req: Request): SessionUser | null {
  const cookieHeader = req.headers.get("cookie");
  const jar = parseCookieHeader(cookieHeader);
  return readSessionToken(jar[SESSION_COOKIE]);
}

// -------------------------
// Auth guards
// -------------------------
export function getSessionUser(req?: Request): SessionUser | null {
  if (req) return getSessionUserFromRequest(req);
  return getSessionUserFromCookies();
}

export function requireUser(req?: Request): SessionUser {
  const u = getSessionUser(req);
  if (!u) throw new Error("UNAUTHORIZED:NO_SESSION");
  return u;
}

export function requireSales(req?: Request): SessionUser {
  const u = getSessionUser(req);
  if (!u) throw new Error("UNAUTHORIZED:NO_SESSION");
  if (u.role !== "SALES" && u.role !== "ADMIN") throw new Error("FORBIDDEN:NOT_SALES");
  return u;
}

export function requireAdmin(req?: Request): SessionUser {
  const u = getSessionUser(req);
  if (!u) throw new Error("UNAUTHORIZED:NO_SESSION");
  if (u.role !== "ADMIN") throw new Error("FORBIDDEN:NOT_ADMIN");
  return u;
}

// -------------------------
// Session setters (route handler NextResponse 호환)
// -------------------------
export function setSessionUser(arg1: any, arg2?: any) {
  // setSessionUser(user)
  if (arg1 && typeof arg1 === "object" && "id" in arg1 && "role" in arg1) {
    const token = createSessionToken(arg1 as SessionUser);
    setSessionCookie(token);
    return;
  }

  // setSessionUser(res, user)
  const res = arg1 as NextResponse;
  const user = arg2 as SessionUser;
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

export function saveSessionUser(arg1: any, arg2?: any) {
  return setSessionUser(arg1, arg2);
}

export function clearSession(arg1?: any) {
  // clearSession()
  if (!arg1) {
    clearSessionCookie();
    return;
  }

  // clearSession(res)
  const res = arg1 as NextResponse;
  // @ts-ignore
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// -------------------------
// Legacy aliases
// -------------------------
export function requireAdminUser(req?: Request) {
  return requireAdmin(req);
}

export function requireSalesUser(req?: Request) {
  return requireSales(req);
}