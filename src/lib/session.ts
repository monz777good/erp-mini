// src/lib/session.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: "SALES" | "ADMIN";
};

// ---------------------
// util
// ---------------------
function secret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD missing");
  return s;
}

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function unb64url(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return Buffer.from(b64 + pad, "base64");
}

function sign(data: string) {
  return b64url(crypto.createHmac("sha256", secret()).update(data).digest());
}

function encode(user: SessionUser) {
  const payload = b64url(Buffer.from(JSON.stringify(user), "utf8"));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decode(token: string): SessionUser | null {
  try {
    const [payload, sig] = String(token || "").split(".");
    if (!payload || !sig) return null;
    if (sign(payload) !== sig) return null;

    const json = unb64url(payload).toString("utf8");
    const u = JSON.parse(json);

    if (!u?.id || !u?.name || !u?.role) return null;

    const role = String(u.role).toUpperCase();
    if (role !== "SALES" && role !== "ADMIN") return null;

    return { id: String(u.id), name: String(u.name), role };
  } catch {
    return null;
  }
}

function parseCookieHeader(h: string | null) {
  const out: Record<string, string> = {};
  (h ?? "")
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((p) => {
      const idx = p.indexOf("=");
      if (idx < 0) return;
      const k = p.slice(0, idx).trim();
      const v = decodeURIComponent(p.slice(idx + 1));
      out[k] = v;
    });
  return out;
}

// ---------------------
// core: get user (req optional)
// ---------------------
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  try {
    // 1) req 있으면 거기서 쿠키 읽기
    if (req) {
      const map = parseCookieHeader(req.headers.get("cookie"));
      const token = map[SESSION_COOKIE];
      return token ? decode(token) : null;
    }

    // 2) 없으면 next/headers cookies() 사용 (Next 16: Promise)
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value ?? null;
    return token ? decode(token) : null;
  } catch {
    return null;
  }
}

// ---------------------
// 권한 (req optional: 0/1 인자 모두 허용)
// ---------------------
export async function requireUser(req?: Request): Promise<SessionUser | null> {
  return getSessionUser(req);
}

export async function requireAdmin(req?: Request): Promise<SessionUser | null> {
  const u = await getSessionUser(req);
  if (!u) return null;
  return u.role === "ADMIN" ? u : null;
}

// ---------------------
// 세션 저장/삭제
// ---------------------
export function setSessionUser(res: NextResponse, user: SessionUser, remember?: boolean) {
  const token = encode(user);
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12,
  });
  return res;
}

export function clearSession(res?: NextResponse) {
  // 0인자 호출도 허용(빌드/호환용)
  if (!res) return;

  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

// ---------------------
// 과거 코드 호환 별칭들
// ---------------------
export const saveSessionUser = setSessionUser;
export const requireAdminUser = requireAdmin;
export const getSessionUserFromRequest = getSessionUser;