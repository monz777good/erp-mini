import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ✅ 관리자용: (임시) 거래처 사업자등록증 "저장" API
 *
 * 현재 스키마에 bizFileUrl / bizFileName 필드가 없어서
 * 타입 에러로 빌드가 깨지고 있었음.
 *
 * 그래서:
 * - 일단 빌드 깨지지 않도록 "노옵(no-op)"으로 처리
 * - 나중에 Client 모델에 bizFileUrl/bizFileName 추가하면
 *   그때 진짜 업로드/저장 로직으로 바꾸면 됨.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // body는 받아두되 지금은 DB에 저장하지 않음(필드 없음)
  // 기대 body 예: { clientId, url, name }
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    skipped: true,
    reason:
      "Client model has no bizFileUrl/bizFileName fields yet. Endpoint is temporarily no-op to allow build.",
    body,
  });
}