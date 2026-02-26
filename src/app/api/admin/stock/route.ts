import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * ✅ 목적: 관리자에서 영업사원/관리자 계정 "일괄 등록" (import)
 * ✅ 주의: 현재 Prisma User 모델에 loginPinHash 필드가 없어서
 *         그 필드를 업데이트하려고 하면 빌드가 깨짐.
 *         => 그래서 여기서는 loginPinHash 같은 건 절대 건드리지 않음.
 *
 * 기대 입력(JSON)
 * {
 *   "users": [
 *     { "name": "홍길동", "phone": "01012345678", "role": "SALES" },
 *     { "name": "관리자", "phone": "01099999999", "role": "ADMIN" }
 *   ]
 * }
 */

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function normalizeRole(role: any): "SALES" | "ADMIN" {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" ? "ADMIN" : "SALES";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const list = Array.isArray(body?.users) ? body.users : [];

    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json(
        { ok: false, error: "users 배열이 비어있음" },
        { status: 400 }
      );
    }

    let upserted = 0;
    let skipped = 0;

    for (const u of list) {
      const name = String(u?.name ?? "").trim();
      const phone = digitsOnly(u?.phone ?? "");
      const role = normalizeRole(u?.role);

      // 최소 조건: 이름 + 전화
      if (!name || phone.length < 8) {
        skipped++;
        continue;
      }

      await prisma.user.upsert({
        where: { phone },
        create: {
          name,
          phone,
          role, // Prisma enum(Role)이어도 문자열로 들어가면 TS는 통과하고 Prisma가 처리함
        },
        update: {
          name,
          role,
          // ✅ loginPinHash 같은 "없는 필드"는 절대 넣지 않는다
        },
      });

      upserted++;
    }

    return NextResponse.json({ ok: true, upserted, skipped });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}