import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const me = await getSessionUser(req as any);
    if (!me) {
      return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
    }

    // ✅ 지금은 스키마 안전이 1순위: 소유자 조건 없이 전체 반환
    // (나중에 ownerUserId 같은 필드 확정되면 여기서 필터링)
    const clients = await prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, clients });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "SERVER_ERROR" }, { status: 500 });
  }
}