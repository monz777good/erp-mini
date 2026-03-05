import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function finalize() {
  // 1) 기존 세션 삭제 (프로젝트에서 쓰던 방식)
  try {
    clearSession();
  } catch {}

  // 2) 쿠키 직접 삭제 (Next 16에서는 cookies()가 await 필요할 수 있음)
  try {
    const c = await cookies();
    c.delete("erp_session");   // 너가 주로 쓰는 쿠키명
    c.delete("session");
    c.delete("iron-session");
  } catch {}

  // 3) 환경/포트/https 꼬임 방지: 절대 URL 금지, 상대경로로만 이동
  const res = new NextResponse(null, { status: 302 });
  res.headers.set("Location", "/login");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET() {
  return finalize();
}

export async function POST() {
  return finalize();
}