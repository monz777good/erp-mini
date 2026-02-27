// ✅ 경로: src/lib/session.ts
import crypto from "crypto";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: string; // "ADMIN" | "SALES"
};

function getSecret() {
  // env 없으면 임시값 (배포마다 값이 바뀌진 않음. 단, env 설정하면 더 안전)
  const raw = process.env.SESSION_PASSWORD || "TEMP_DEV_SESSION_PASSWORD_CHANGE_ME";
  return crypto.createHash("sha256").update(raw).digest(); // 32 bytes
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

function sign(payload: string) {
  return b64url(crypto.createHmac("sha256", getSecret()).update(payload).digest());
}

function encode(user: SessionUser, maxAgeSec: number) {
  const payloadObj = { ...user, exp: Date.now() + maxAgeSec * 1000 };
  const payload = b64url(Buffer.from(JSON.stringify(payloadObj), "utf8"));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decode(token: string): SessionUser | null {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;

  try {
    const obj = JSON.parse(b64urlToBuf(payload).toString("utf8"));
    if (!obj?.id || !obj?.name || !obj?.role) return null;
    if (obj?.exp && Date.now() > Number(obj.exp)) return null;
    return { id: String(obj.id), name: String(obj.name), role: String(obj.role) };
  } catch {
    return null;
  }
}

/** ✅ Request에서 쿠키 읽기 */
export function getSessionUserFromRequest(req: Request): SessionUser | null {
  const raw = req.headers.get("cookie") || "";
  const parts = raw.split(";").map((v) => v.trim());
  const found = parts.find((p) => p.startsWith(SESSION_COOKIE + "="));
  if (!found) return null;
  const token = decodeURIComponent(found.slice((SESSION_COOKIE + "=").length));
  return decode(token);
}

/**
 * ✅ 기존 코드들이 import하던 이름: getSessionUser
 * - req가 들어오면: 헤더 cookie로 읽음
 * - req가 없으면: next/headers cookies()로 읽음 (환경에 따라 cookies()가 Promise일 수도 있어서 안전 처리)
 */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  try {
    if (req) return getSessionUserFromRequest(req);

    const cAny: any = cookies();
    const store = typeof cAny?.then === "function" ? await cAny : cAny; // ✅ async cookies() 대응
    const token = store?.get?.(SESSION_COOKIE)?.value;
    if (!token) return null;
    return decode(String(token));
  } catch {
    return null;
  }
}

/** ✅ Response에 쿠키 심기 */
export function saveSessionUser(
  res: NextResponse,
  user: SessionUser,
  opts?: { remember?: boolean }
) {
  const remember = !!opts?.remember;
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12; // 30일 or 12시간
  const token = encode(user, maxAge);

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  });
}

// ✅ 기존 이름 호환용 alias
export const setSessionUser = saveSessionUser;

export function clearSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

// ✅ 기존 코드 호환: requireUser / requireAdmin (req 없이 호출하는 코드도 있을 수 있어서 둘 다 허용)
export async function requireUser(req?: Request) {
  return await getSessionUser(req);
}

export async function requireAdmin(req?: Request) {
  const u = await getSessionUser(req);
  if (!u) return null;
  if (String(u.role).toUpperCase() !== "ADMIN") return null;
  return u;
}