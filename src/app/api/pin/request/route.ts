import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * ✅ PIN 시스템 비활성화 (스키마에 dailyPin 모델 없음)
 * - 빌드 통과용 더미 엔드포인트
 * - 나중에 PIN 기능 다시 만들 때 Prisma 모델 추가 후 구현
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "PIN 기능은 현재 비활성화되어 있습니다.",
    },
    { status: 501 }
  );
}