import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ 일단 빌드 깨는 것부터 막는 "안전한 더미" 엔드포인트
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Not implemented yet" },
    { status: 501 }
  );
}