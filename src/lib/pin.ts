import crypto from "crypto";

function getKstDateKey(d = new Date()) {
  // KST(UTC+9) 기준 YYYY-MM-DD
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayKeyKST() {
  return getKstDateKey(new Date());
}

export function makePin6() {
  // 000000 ~ 999999
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

export function hashPin(pin: string) {
  const salt = process.env.PIN_SALT || process.env.SESSION_PASSWORD || "pin_salt";
  return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

export function verifyPin(pin: string, hash: string) {
  return hashPin(pin) === hash;
}