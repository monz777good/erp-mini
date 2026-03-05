import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ 브라우저가 /api/logout 로 직접 들어오면(GET) → 그냥 /login 으로 보내기
export async function GET() {
  await clearSession();
  return NextResponse.redirect(new URL("/login", "http://localhost"));
}

// ✅ 프론트는 무조건 POST로 호출
export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}