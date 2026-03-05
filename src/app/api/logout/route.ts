// src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ 핵심: 절대 URL 만들지 말고, Location을 "/login" (상대경로)로 고정
function redirectToLogin() {
  clearSession();

  const res = new NextResponse(null, { status: 302 });
  res.headers.set("Location", "/login");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET() {
  return redirectToLogin();
}

export async function POST() {
  return redirectToLogin();
}