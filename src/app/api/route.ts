import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ API 루트 헬스체크 (빌드/배포 통과용)
// - 세션 의존 제거(지금 getSession 시그니처 불일치로 빌드가 죽어서)
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "ERP API is running",
  });
}