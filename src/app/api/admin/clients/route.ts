// src/app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") ?? "").trim();

    const clients = await prisma.client.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              // ⚠️ owner 필드는 Client 모델에 없어서 빌드가 터졌던 거야.
              // 대표자까지 검색하고 싶으면, prisma/schema.prisma의 Client 모델에 있는
              // "대표자 필드명"으로 아래 한 줄을 바꿔서 추가하면 됨.
              // 예) { ceoName: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, clients });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}