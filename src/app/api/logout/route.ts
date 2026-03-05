import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 브라우저가 /api/logout 로 직접 들어오면(GET) → 현재 origin 기준으로 /login
export async function GET(req: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/login", req.url));
}

// 프론트는 무조건 POST로 호출
export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}