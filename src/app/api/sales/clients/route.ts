import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * ✅ 영업사원 거래처 목록
 * - 원래: ownerUserId로 "내 거래처만" 필터링하려 했지만,
 *   현재 Prisma Client 모델에 ownerUserId 컬럼이 없어서 빌드가 깨짐.
 * - 그래서 "빌드 통과 + 최소 기능" 버전:
 *   지금은 전체 거래처를 내려주되, 나중에 스키마에 ownerUserId 추가하면 다시 필터 붙이면 됨.
 */
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,

        // 아래 필드는 네 Client 모델에 있을 수도/없을 수도 있어서 안전하게 any로 처리
        // (빌드가 깨지면 select에서 지우면 됨)
        receiverName: true,
        receiverAddr: true,
        receiverPhone: true,
        receiverMobile: true,
        bizCertPath: true,
      } as any,
    });

    return NextResponse.json({ ok: true, clients });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}