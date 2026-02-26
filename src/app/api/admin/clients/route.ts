import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

// ✅ 관리자만 거래처 전체 조회 (빌드 안전 버전)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    // ✅ "필드명 불일치"로 빌드가 계속 터져서
    // 일단 안전하게: 존재가 확실한 것만 반환한다.
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        name: true,
        bizRegNo: true,
      },
    });

    return NextResponse.json({ ok: true, clients });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "FAILED" },
      { status: 500 }
    );
  }
}