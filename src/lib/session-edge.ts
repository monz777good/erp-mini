// src/lib/session-edge.ts
import type { SessionUser } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session";

function getSecret(): string {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD is missing in .env");
  return s;
}

function base64UrlToUint8Array(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToString(b64url: string) {
  const bytes = base64UrlToUint8Array(b64url);
  return new TextDecoder().decode(bytes);
}

function toHex(buf: ArrayBuffer) {
  const arr = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += arr[i].toString(16).padStart(2, "0");
  return s;
}

async function hmacSha256Hex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

export async function parseSessionTokenEdge(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token) return null;

  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;

  try {
    const expected = await hmacSha256Hex(getSecret(), b64);
    if (expected !== sig) return null;

    const json = base64UrlToString(b64);
    const data = JSON.parse(json);

    if (!data?.id || !data?.name || !data?.role) return null;
    if (data.role !== "SALES" && data.role !== "ADMIN") return null;

    return { id: data.id, name: data.name, role: data.role };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };