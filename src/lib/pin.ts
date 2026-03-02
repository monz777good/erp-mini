import crypto from "crypto";

const PEPPER = process.env.PIN_PEPPER || "";

export function hashPin(pin: string) {
  if (!PEPPER) throw new Error("PIN_PEPPER is missing");
  return crypto.createHash("sha256").update(pin + PEPPER).digest("hex");
}

export function verifyPin(input: string, stored: string | null) {
  if (!stored) return false;
  return hashPin(input) === stored;
}