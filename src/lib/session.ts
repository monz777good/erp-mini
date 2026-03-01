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

// ============================
// 내부 유틸
// ============================
function secret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD missing");
  return s;
}

function sign(data: string) {
  return crypto.createHmac("sha256", secret()).update(data).digest("hex");
}

function encode(user: SessionUser) {
  const payload = JSON.stringify({
    id: user.id,
    name: user.name,
    role: user.role,
    iat: Date.now(),
  });
  const sig = sign(payload);
  return Buffer.from(payload, "utf8").toString("base64") + "." + sig;
}

function decode(token?: string | null): SessionUser | null {
  if (!token) return null;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const payload = Buffer.from(payloadB64, "base64").toString("utf8");
  if (sign(payload) !== sig) return null;

  try {
    const parsed = JSON.parse(payload);
    const role = String(parsed.role).toUpperCase();
    if (role !== "SALES" && role !== "ADMIN") return null;

    return {
      id: String(parsed.id),
      name: String(parsed.name),
      role,
    };
  } catch {
    return null;
  }
}

// ============================
// 세션 읽기 (Next 16 대응)
// ============================
export async function getSessionUser(_req?: Request): Promise<SessionUser | null> {
  try {
    const store = await cookies();   // ⭐ 핵심 수정 (await)
    const token = store.get(SESSION_COOKIE)?.value ?? null;
    return decode(token);
  } catch {
    return null;
  }
}

export async function getSessionUserFromRequest(req: Request) {
  return getSessionUser(req);
}

// ============================
// 세션 저장
// ============================
export function setSessionUser(res: NextResponse, user: SessionUser, remember?: boolean) {
  const token = encode(user);

  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12,
  });

  return res;
}

// 호환용 export
export const saveSessionUser = setSessionUser;

// ============================
// 세션 삭제 (0 / 1 인자 둘다 허용)
// ============================
export function clearSession(): void;
export function clearSession(res: NextResponse): NextResponse;
export function clearSession(res?: NextResponse) {
  if (!res) return;

  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}

// ============================
// 권한
// ============================
export async function requireUser(req?: Request) {
  return getSessionUser(req);
}

export async function requireAdmin(req?: Request) {
  const u = await getSessionUser(req);
  if (!u) return null;
  return u.role === "ADMIN" ? u : null;
}

export async function requireAdminUser(req?: Request) {
  return requireAdmin(req);
}