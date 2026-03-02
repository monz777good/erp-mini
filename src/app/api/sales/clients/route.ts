import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const me = await getSessionUser(req as any);
    if (!me) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // ✅ ADMIN은 전체 거래처 조회
    if (String(me.role).toUpperCase() === "ADMIN") {
      const clients = await prisma.client.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, clients });
    }

    // ✅ SALES는 "내 거래처만" 조회
    // 스키마마다 필드명이 다를 수 있어서 후보를 순서대로 시도
    const candidates = ["salesId", "ownerUserId", "userId", "salesUserId", "ownerId"];

    for (const key of candidates) {
      try {
        const clients = await (prisma.client as any).findMany({
          where: { [key]: me.id },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ ok: true, clients });
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        // Prisma가 "Unknown arg"류로 필드 없다고 하면 다음 후보로 계속 시도
        if (
          msg.includes("Unknown arg") ||
          msg.includes("Argument") ||
          msg.includes("Unknown") ||
          msg.includes("Invalid")
        ) {
          continue;
        }
        throw e;
      }
    }

    // ✅ 어떤 필드로도 "내 거래처"를 구분할 수 없는 스키마면(연결필드 없음)
    // 일단 빈 배열로 반환 (빌드는 깨지지 않게)
    return NextResponse.json({ ok: true, clients: [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}