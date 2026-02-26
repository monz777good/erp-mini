import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  phone?: string;
  role: string;
};

function getSecretBytes() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD 환경변수가 없습니다.");
  return new TextEncoder().encode(s);
}

function b64urlEncode(bytes: Uint8Array) {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeToBytes(s: string) {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacSha256(data: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    getSecretBytes(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return new Uint8Array(sig);
}

async function makeToken(user: SessionUser) {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(user));
  const sigBytes = await hmacSha256(payloadBytes);
  return `${b64urlEncode(payloadBytes)}.${b64urlEncode(sigBytes)}`;
}

async function verifyToken(token: string): Promise<SessionUser | null> {
  const [p, s] = token.split(".");
  if (!p || !s) return null;

  const payloadBytes = b64urlDecodeToBytes(p);
  const sigBytes = b64urlDecodeToBytes(s);

  const key = await crypto.subtle.importKey(
    "raw",
    getSecretBytes(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
  if (!ok) return null;

  try {
    const json = new TextDecoder().decode(payloadBytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** ✅ Route Handler 등에서: Response에 세션 쿠키 심기 */
export async function setSessionUser(res: NextResponse, user: SessionUser) {
  const token = await makeToken(user);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

/** ✅ Server Component/Route Handler에서: 쿠키로 세션 읽기 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const c = cookies().get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifyToken(c.value);
}

/** ✅ Middleware(Edge)에서: req로 세션 읽기 */
export async function getSessionUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const c = req.cookies.get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifyToken(c.value);
}

export async function clearSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}