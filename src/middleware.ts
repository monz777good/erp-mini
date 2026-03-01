import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session";

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ✅ 공개 경로
  if (
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/admin-login") ||
    path.startsWith("/sales-login")
  ) {
    return NextResponse.next();
  }

  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  const user = readSessionToken(raw);

  // ✅ 로그인 안 되어 있으면 무조건 /login
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const role = user.role;

  // ✅ 관리자 영역: ADMIN만
  if (path.startsWith("/admin")) {
    if (role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/orders"; // 영업 화면으로 돌림
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ✅ 영업 영역: SALES 또는 ADMIN 허용
  if (path.startsWith("/orders") || path.startsWith("/clients")) {
    if (role !== "SALES" && role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}