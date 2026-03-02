// src/lib/session.ts
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: "SALES" | "ADMIN";
};

function getSecret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD is missing");
  return s;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function encode(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decode(token: string): SessionUser | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  if (sig !== expected) return null;

  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as SessionUser;
  } catch {
    return null;
  }
}

// ✅ 공통: 쿠키 헤더에서 SESSION_COOKIE 값만 뽑기
function parseCookieHeader(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return m?.[1] ?? null;
}

/**
 * ✅ (레거시 호환) 미들웨어에서 쓰던 토큰 읽기 함수
 * - NextRequest를 주로 받지만, Request도 허용
 * - 토큰 문자열만 리턴 (없으면 null)
 */
export function readSessionToken(req: Request | NextRequest): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  return parseCookieHeader(cookieHeader);
}

// ✅ req 있으면 헤더에서, 없으면 cookies() 사용 (Next16: cookies() async)
async function readCookieValue(req?: Request | NextRequest): Promise<string | null> {
  if (req) {
    const cookieHeader = req.headers.get("cookie") || "";
    return parseCookieHeader(cookieHeader);
  }

  try {
    const c = await cookies();
    return c.get(SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: Request | NextRequest): Promise<SessionUser | null> {
  const token = await readCookieValue(req);
  if (!token) return null;
  return decode(token);
}

export async function requireUser(req?: Request | NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(req?: Request | NextRequest): Promise<SessionUser> {
  const user = await requireUser(req);
  if (user.role !== "ADMIN") throw new Error("Unauthorized");
  return user;
}

/**
 * ✅ 쿠키 쓰기 (2가지 호출 다 지원)
 * 1) saveSessionUser(user)          -> cookies()에 set
 * 2) saveSessionUser(res, user)     -> res 헤더에 Set-Cookie로 set (기존 코드 호환)
 */
export async function saveSessionUser(arg1: SessionUser | NextResponse, arg2?: SessionUser) {
  const user = (arg2 ?? arg1) as SessionUser;
  const token = encode(user);

  const cookieOptions = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  // cookieOptions.push("Secure"); // HTTPS에서만 필요하면 켜

  const setCookieValue = cookieOptions.join("; ");

  if (arg1 instanceof NextResponse) {
    arg1.headers.append("Set-Cookie", setCookieValue);
    return;
  }

  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

// ✅ 기존 코드 호환(이름만 다른 케이스)
export async function setSessionUser(arg1: SessionUser | NextResponse, arg2?: SessionUser) {
  return saveSessionUser(arg1 as any, arg2 as any);
}

export async function clearSession(res?: NextResponse) {
  const cookieOptions = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  const setCookieValue = cookieOptions.join("; ");

  if (res instanceof NextResponse) {
    res.headers.append("Set-Cookie", setCookieValue);
    return;
  }

  const c = await cookies();
  c.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}