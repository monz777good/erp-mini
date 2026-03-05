import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export type Role = "SALES" | "ADMIN";

export type SessionUser = {
  id: string;
  role: Role;
  name?: string | null;
  phone?: string | null;
};

const COOKIE_NAME = "erp_session";

function hmac(data: string) {
  const secret = process.env.SESSION_PASSWORD || "dev-secret";
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function encode(u: SessionUser) {
  const json = JSON.stringify(u);
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  const sig = hmac(b64);
  return `${b64}.${sig}`;
}

function decode(v: string): SessionUser | null {
  const [b64, sig] = v.split(".");
  if (!b64 || !sig) return null;
  if (hmac(b64) !== sig) return null;

  try {
    const json = Buffer.from(b64, "base64url").toString("utf8");
    const u = JSON.parse(json);
    if (!u?.id || !u?.role) return null;
    return u as SessionUser;
  } catch {
    return null;
  }
}

/** ✅ Next16 타입 이슈: cookies()가 Promise로 잡히는 케이스 대응 */
export async function getSession(): Promise<SessionUser | null> {
  const c = await cookies();
  const v = c.get(COOKIE_NAME)?.value;
  if (!v) return null;
  return decode(v);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return getSession();
}

export async function setSessionUser(user: SessionUser) {
  const c = await cookies();
  const v = encode(user);
  c.set(COOKIE_NAME, v, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function setSession(user: SessionUser) {
  return setSessionUser(user);
}

export async function clearSession() {
  const c = await cookies();
  c.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function requireUser(): Promise<SessionUser | NextResponse> {
  const u = await getSession();
  if (!u) {
    return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  }
  return u;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const u = await getSession();
  if (!u) {
    return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  }
  if (u.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "NOT_ADMIN" }, { status: 403 });
  }
  return u;
}