// Node.js runtime 전용 (crypto 사용 가능)
import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

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

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function unb64url(str: string) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function sign(payloadB64: string) {
  const h = crypto.createHmac("sha256", getSecret()).update(payloadB64).digest();
  return b64url(h);
}

function encode(user: SessionUser) {
  const payloadB64 = b64url(Buffer.from(JSON.stringify(user), "utf8"));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

function decode(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  try {
    // timing safe compare
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const json = unb64url(payloadB64).toString("utf8");
    const parsed = JSON.parse(json);
    if (!parsed?.id || !parsed?.name || !parsed?.role) return null;
    const role = String(parsed.role).toUpperCase();
    if (role !== "SALES" && role !== "ADMIN") return null;
    return { id: String(parsed.id), name: String(parsed.name), role } as SessionUser;
  } catch {
    return null;
  }
}

/** ✅ (기존 코드들이 찾던 이름들) 전부 제공 */
export function getSession(req?: Request) {
  if (req) {
    const cookie = req.headers.get("cookie") || "";
    const m = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
    return decode(m?.[1] ?? null);
  }
  const c = cookies().get(SESSION_COOKIE)?.value;
  return decode(c ?? null);
}

export function getUserFromRequest(req: Request) {
  return getSession(req);
}

export function getUserIdCookie(req?: Request) {
  return getSession(req)?.id ?? null;
}

export function requireAdmin(req?: Request) {
  const u = getSession(req);
  if (!u) return null;
  return u.role === "ADMIN" ? u : null;
}

export function saveSessionUser(res: NextResponse, user: SessionUser) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: encode(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}

export function clearSession(res: NextResponse) {
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