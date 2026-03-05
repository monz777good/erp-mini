import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin(req: NextRequest) {
  // ✅ 현재 요청 URL 기준으로 /login 으로 안전하게 리다이렉트 (로컬/배포 모두 OK)
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function GET(req: NextRequest) {
  clearSession();
  return redirectToLogin(req);
}

export async function POST(req: NextRequest) {
  clearSession();
  return redirectToLogin(req);
}
