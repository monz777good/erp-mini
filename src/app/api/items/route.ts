// src/app/api/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // ✅ 로그인 체크 (영업/관리자 모두 가능)
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.item.findMany({
      orderBy: { createdAt: "asc" },
    });

    // 너 프로젝트에서 프론트가 배열을 기대하는 경우가 많아서 "배열"로 고정 추천
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}