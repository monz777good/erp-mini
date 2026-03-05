import crypto from "crypto";

const PEPPER = process.env.PIN_PEPPER || "erp-mini-secret";

/**
 * PIN 해시 생성
 */
export function hashPin(pin: string) {
  return crypto
    .createHash("sha256")
    .update(pin + ":" + PEPPER)
    .digest("hex");
}

/**
 * PIN 비교 (타이밍 공격 방지)
 */
export function verifyPin(pin: string, hashed: string) {
  const a = Buffer.from(hashPin(pin), "utf8");
  const b = Buffer.from(hashed, "utf8");

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(
    new Uint8Array(a),
    new Uint8Array(b)
  );
}