import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER ?? "";
  return sha256Hex(`${pin}:${pepper}`);
}

export async function loginOrRegisterSales(params: { phone: string; pin: string; name?: string }) {
  const phone = digitsOnly(params.phone);
  const pin = String(params.pin ?? "");
  const name = String(params.name ?? "").trim();

  if (!phone || phone.length < 10) throw new Error("PHONE_REQUIRED");
  if (!pin || pin.length < 4) throw new Error("PIN_REQUIRED");

  const pinHash = hashPin(pin);

  let user = await prisma.user.findFirst({
    where: { phone, role: "SALES" },
  });

  if (!user) {
    if (!name) throw new Error("NAME_REQUIRED");
    user = await prisma.user.create({
      data: { name, phone, role: "SALES", pin: pinHash },
    });
  } else {
    if (!user.pin || user.pin !== pinHash) throw new Error("INVALID_PIN");
  }

  setSessionUser({ id: user.id, name: user.name, role: user.role as any });
  return user;
}

export async function loginOrRegisterAdmin(params: { phone: string; pin: string; name?: string }) {
  const phone = digitsOnly(params.phone);
  const pin = String(params.pin ?? "");
  const name = String(params.name ?? "").trim();

  if (!phone || phone.length < 10) throw new Error("PHONE_REQUIRED");
  if (!pin || pin.length < 4) throw new Error("PIN_REQUIRED");

  const pinHash = hashPin(pin);

  let user = await prisma.user.findFirst({
    where: { phone, role: "ADMIN" },
  });

  if (!user) {
    if (!name) throw new Error("NAME_REQUIRED");
    user = await prisma.user.create({
      data: { name, phone, role: "ADMIN", pin: pinHash },
    });
  } else {
    if (!user.pin || user.pin !== pinHash) throw new Error("INVALID_PIN");
  }

  setSessionUser({ id: user.id, name: user.name, role: user.role as any });
  return user;
}