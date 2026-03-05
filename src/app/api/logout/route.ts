import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 브라우저가 직접 접근하면 로그인으로 이동
export async function GET(req: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/login", req.url));
}

// 프론트에서 로그아웃 호출
export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}