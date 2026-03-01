import { cookies } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE = "erp_session";

export type SessionRole = "SALES" | "ADMIN";
export type SessionUser = { id: string; name: string; role: SessionRole };

function getKey() {
  const raw = process.env.SESSION_PASSWORD || "";
  if (!raw || raw.length < 10) throw new Error("SESSION_PASSWORD missing/too short");
  return crypto.createHash("sha256").update(raw).digest(); // 32 bytes
}

function b64urlEncode(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function encrypt(obj: any) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plain = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return b64urlEncode(Buffer.concat([iv, tag, enc]));
}

function decrypt(token: string) {
  const key = getKey();
  const raw = b64urlDecode(token);
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}

export async function setSessionUser(user: SessionUser, opts: { remember?: boolean } = {}) {
  const token = encrypt({ v: 1, user, ts: Date.now() });
  const maxAge = opts.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8; // 30일 / 8시간

  const jar = await cookies(); // ✅ Promise 대응
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearSession() {
  const jar = await cookies(); // ✅ Promise 대응
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies(); // ✅ Promise 대응
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const data = decrypt(token);
    const u = data?.user;
    if (!u?.id || !u?.name || !u?.role) return null;
    const role = String(u.role).toUpperCase();
    if (role !== "SALES" && role !== "ADMIN") return null;
    return { id: String(u.id), name: String(u.name), role };
  } catch {
    return null;
  }
}

export async function requireAdminUser(): Promise<SessionUser | null> {
  const u = await getSessionUser();
  if (!u || u.role !== "ADMIN") return null;
  return u;
}

/* ✅ 예전 코드 호환용 export (없어서 빌드 터지는 거 방지) */
export const saveSessionUser = setSessionUser;
export async function getSessionUserFromRequest(_req?: any) {
  return getSessionUser();
}
export async function requireAdmin(_req?: any) {
  return requireAdminUser();
}
export async function requireUser(_req?: any) {
  return getSessionUser();
}