import crypto from "crypto";
import { cookies } from "next/headers";

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
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromB64url(s: string) {
  // base64 padding 복구
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(data: string) {
  const mac = crypto.createHmac("sha256", getSecret()).update(data).digest();
  return b64url(mac);
}

function encode(payload: any) {
  const json = JSON.stringify(payload);
  const data = b64url(Buffer.from(json));
  const sig = sign(data);
  return `${data}.${sig}`;
}

function decode(token: string): any | null {
  const [data, sig] = String(token || "").split(".");
  if (!data || !sig) return null;
  if (sign(data) !== sig) return null;

  try {
    const json = fromB64url(data).toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser) {
  const token = encode({ ...user, iat: Date.now() });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // ✅ Vercel HTTPS에서 필수
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

export function clearSession() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionUser(): SessionUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = decode(token);
  if (!payload?.id) return null;

  return {
    id: String(payload.id),
    name: String(payload.name ?? ""),
    role: payload.role === "ADMIN" ? "ADMIN" : "SALES",
  };
}

export function requireAdminUser() {
  const u = getSessionUser();
  if (!u || u.role !== "ADMIN") return null;
  return u;
}