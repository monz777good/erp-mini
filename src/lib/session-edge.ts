// Edge runtime 전용 (Node crypto 금지) → WebCrypto 사용
export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: "SALES" | "ADMIN";
};

function b64urlToBytes(str: string) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes: ArrayBuffer) {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSha256(secret: string, msg: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return bytesToB64url(sig);
}

function getCookie(cookieHeader: string, name: string) {
  const m = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return m?.[1] ?? null;
}

export async function getSessionUserEdge(req: Request): Promise<SessionUser | null> {
  const secret = (process.env.SESSION_PASSWORD || "").trim();
  if (!secret) return null;

  const cookie = req.headers.get("cookie") || "";
  const token = getCookie(cookie, SESSION_COOKIE);
  if (!token) return null;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = await hmacSha256(secret, payloadB64);
  if (sig !== expected) return null;

  try {
    const json = new TextDecoder().decode(b64urlToBytes(payloadB64));
    const parsed = JSON.parse(json);
    const role = String(parsed.role).toUpperCase();
    if (!parsed?.id || !parsed?.name) return null;
    if (role !== "SALES" && role !== "ADMIN") return null;
    return { id: String(parsed.id), name: String(parsed.name), role } as SessionUser;
  } catch {
    return null;
  }
}