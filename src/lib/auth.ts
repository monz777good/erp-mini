import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import crypto from "crypto";

type Role = "SALES" | "ADMIN";

function hashPin(pin: string) {
  const pepper = process.env.PIN_PEPPER ?? "";
  return crypto.createHash("sha256").update(`${pin}:${pepper}`).digest("hex");
}

/**
 * ✅ 공용 로그인 헬퍼
 * - phone/pin 필수
 * - user 없으면 SALES만 자동 생성 (name 필수)
 * - 있으면 pin 검증
 * - roleHint가 ADMIN이면 실제 ADMIN인지 확인
 * - 성공 시 세션 저장 (phone 포함!)
 */
export async function loginWithPhonePin(args: {
  roleHint?: Role;
  phone: string;
  pin: string;
  name?: string;
}) {
  const roleHint = (args.roleHint ?? "SALES") as Role;
  const phone = String(args.phone ?? "").trim();
  const pin = String(args.pin ?? "").trim();
  const name = String(args.name ?? "").trim();

  if (!phone || !pin) {
    return { ok: false as const, status: 400, error: "PHONE_PIN_REQUIRED" };
  }

  const hashed = hashPin(pin);

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, name: true, phone: true, role: true, pin: true },
  });

  // 없으면 SALES 자동 생성
  if (!user) {
    if (roleHint === "ADMIN") {
      return { ok: false as const, status: 404, error: "ADMIN_NOT_FOUND" };
    }
    if (!name) {
      return { ok: false as const, status: 400, error: "NAME_REQUIRED" };
    }

    const created = await prisma.user.create({
      data: { name, phone, role: "SALES" as any, pin: hashed },
      select: { id: true, name: true, phone: true, role: true },
    });

    await setSessionUser({
      id: created.id,
      name: created.name,
      phone: created.phone,
      role: created.role as any,
    });

    return { ok: true as const, user: created, created: true };
  }

  // ADMIN 힌트면 실제 ADMIN인지 확인
  if (roleHint === "ADMIN" && user.role !== "ADMIN") {
    return { ok: false as const, status: 403, error: "NOT_ADMIN" };
  }

  // pin 검증 (없으면 첫 로그인 설정)
  if (!user.pin) {
    await prisma.user.update({
      where: { id: user.id },
      data: { pin: hashed },
    });
  } else {
    if (user.pin !== hashed) {
      return { ok: false as const, status: 401, error: "INVALID_PIN" };
    }
  }

  await setSessionUser({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role as any,
  });

  return { ok: true as const, user, created: false };
}