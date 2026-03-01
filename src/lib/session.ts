import { cookies, headers } from "next/headers";

export const SESSION_COOKIE = "erp_session";

export type SessionUser = {
  id: string;
  name: string;
  role: "SALES" | "ADMIN";
};

function mustSecret() {
  const s = process.env.SESSION_PASSWORD;
  if (!s) throw new Error("SESSION_PASSWORD is missing");
  return s;
}

function b64urlEncode(bytes: Uint8Array) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  const b64 = Buffer.from(str, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeToBytes(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf);
}

async function hmacSha256(message: string, secret: string) {
  // WebCrypto(HMAC) - node/edge 둘 다 안정적
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return new Uint8Array(sig);
}

function parseCookieHeader(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1).trim();
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

async function decodeSession(token: string): Promise<SessionUser | null> {
  try {
    const secret = mustSecret();
    const [payloadPart, sigPart] = token.split(".");
    if (!payloadPart || !sigPart) return null;

    const payloadBytes = b64urlDecodeToBytes(payloadPart);
    const payloadJson = Buffer.from(payloadBytes).toString("utf8");
    const payload = JSON.parse(payloadJson);

    const expectedSig = await hmacSha256(payloadPart, secret);
    const gotSig = b64urlDecodeToBytes(sigPart);

    if (gotSig.length !== expectedSig.length) return null;
    for (let i = 0; i < gotSig.length; i++) {
      if (gotSig[i] !== expectedSig[i]) return null;
    }

    if (!payload?.id || !payload?.name || !payload?.role) return null;
    return { id: String(payload.id), name: String(payload.name), role: payload.role };
  } catch {
    return null;
  }
}

async function encodeSession(user: SessionUser): Promise<string> {
  const payloadObj = { id: user.id, name: user.name, role: user.role, iat: Date.now() };
  const payloadJson = JSON.stringify(payloadObj);
  const payloadPart = b64urlEncode(Buffer.from(payloadJson, "utf8"));
  const sig = await hmacSha256(payloadPart, mustSecret());
  const sigPart = b64urlEncode(sig);
  return `${payloadPart}.${sigPart}`;
}

/**
 * ✅ req를 주면: req.headers.cookie에서 읽음
 * ✅ req가 없으면: next/headers cookies()에서 읽음
 */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  const token =
    req
      ? parseCookieHeader(req.headers.get("cookie"), SESSION_COOKIE)
      : cookies().get(SESSION_COOKIE)?.value ??
        parseCookieHeader(headers().get("cookie"), SESSION_COOKIE);

  if (!token) return null;
  return await decodeSession(token);
}

/**
 * ✅ Route Handler에서 쓰기 좋게: setSessionUser(res, user) 형태로 제공
 */
export async function setSessionUser(res: Response, user: SessionUser) {
  const token = await encodeSession(user);
  // Response가 NextResponse인 경우 cookies.set 사용 가능하지만,
  // 여기서는 Set-Cookie 헤더로 확실히 박아버림 (가장 안전)
  const cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    // 14일
    `Max-Age=${60 * 60 * 24 * 14}`,
  ]
    .filter(Boolean)
    .join("; ");

  res.headers.append("Set-Cookie", cookie);
}

export function clearSession(res: Response) {
  const cookie = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");
  res.headers.append("Set-Cookie", cookie);
}