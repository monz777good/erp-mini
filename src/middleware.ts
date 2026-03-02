// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session";

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 로그인 페이지/정적은 그냥 통과
  if (pathname.startsWith("/login") || pathname.startsWith("/sales-login")) {
    return NextResponse.next();
  }

  // ✅ 여기 핵심: readSessionToken에는 "req"를 넣는다 (raw 문자열 넣는 거 아님)
  const token = readSessionToken(req);

  // 로그인 안 되어 있으면 /login으로
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}