// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};

const SESSION_COOKIE = "erp_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ API는 미들웨어에서 건드리지 않음
  if (pathname.startsWith("/api")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value ?? "";

  const isLogin = pathname === "/login" || pathname.startsWith("/login/");
  const isAdminArea = pathname.startsWith("/admin");
  const isSalesArea = pathname.startsWith("/orders") || pathname.startsWith("/clients");

  // ✅ 로그인 안함: 보호구역 접근 막기
  if (!token) {
    if (isAdminArea || isSalesArea) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ✅ 로그인 했으면: /login 접근하면 기본 홈으로 보내기 (역할 판별은 Edge에서 안 함)
  if (isLogin) {
    const url = req.nextUrl.clone();
    // role은 Edge에서 crypto 없이 해독 못하니까, 일단 /orders로 보냄
    // (관리자는 /orders에서 /admin 들어가게 하거나, 페이지에서 /api/me로 role 확인 후 이동)
    url.pathname = "/orders";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}