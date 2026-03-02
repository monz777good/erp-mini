// src/lib/pin.ts
import crypto from "crypto";

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER ?? "";
  if (!pepper) throw new Error("PIN_PEPPER env가 없습니다.");
  return sha256Hex(`${pin}:${pepper}`);
}

export function verifyPin(pin: string, hashed: string | null | undefined) {
  if (!hashed) return false;
  const h = hashPin(pin);
  // timing-safe compare
  const a = Buffer.from(h);
  const b = Buffer.from(String(hashed));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}