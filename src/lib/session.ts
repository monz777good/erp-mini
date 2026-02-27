// ✅ 경로: src/lib/session.ts
import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: string; // "ADMIN" | "SALES"
};

// ✅ 비밀키: 환경변수 없으면 임시 기본값 사용(배포마다 바뀌면 자동로그인 풀릴 수 있음)
function getSecret() {
  const s =
    process.env.SESSION_PASSWORD ||
    process.env.NEXT_PUBLIC_SESSION_PASSWORD ||
    "TEMP_DEV_SESSION_PASSWORD_CHANGE_ME";
  return crypto.createHash("sha256").update(s).digest(); // 32 bytes
}

function b64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
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

function encode(obj: any) {
  const json = JSON.stringify(obj);
  const payload = b64url(json);
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decode(token: string) {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const json = b64urlToBuf(payload).toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

type SaveOpts = {
  remember?: boolean; // 자동로그인
};

export function clearSession(res?: NextResponse) {
  // route handler: res.cookies.set 권장
  if (res) {
    res.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: true,
    });
    return;
  }

  // server component / action: cookies().set 가능
  try {
    cookies().set(SESSION_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: true,
    });
  } catch {}
}

// ✅ saveSessionUser = setSessionUser (둘 다 제공해서 import 에러 방지)
export function saveSessionUser(res: NextResponse, user: SessionUser, opts?: SaveOpts) {
  const remember = !!opts?.remember;
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12; // 30일 or 12시간

  const token = encode({
    ...user,
    exp: Date.now() + maxAge * 1000,
  });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    maxAge,
  });
}

export const setSessionUser = saveSessionUser;

// ✅ 읽기
export async function getSessionUser() {
  try {
    const c = cookies().get(SESSION_COOKIE)?.value;
    if (!c) return null;
    const data = decode(c);
    if (!data?.id || !data?.name || !data?.role) return null;
    if (data?.exp && Date.now() > Number(data.exp)) return null;
    return { id: String(data.id), name: String(data.name), role: String(data.role) } as SessionUser;
  } catch {
    return null;
  }
}

// ✅ 이게 지금 빌드 깨는 핵심 export
export async function requireUser() {
  return await getSessionUser();
}

export async function requireAdmin() {
  const u = await getSessionUser();
  if (!u) return null;
  if (String(u.role).toUpperCase() !== "ADMIN") return null;
  return u;
}