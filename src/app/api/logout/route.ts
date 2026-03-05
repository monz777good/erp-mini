import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  clearSession();

  const res = NextResponse.redirect(new URL("/login", "http://localhost"));
  // Next가 실제 호스트로 바꿔줌 (상대경로 리다이렉트 용)
  res.headers.set("Location", "/login");
  return res;
}