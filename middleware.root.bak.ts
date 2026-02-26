import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ /admin 이하만 권한 체크
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const role = req.cookies.get("role")?.value;

  // 1) 로그인 안 됐으면 로그인으로
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2) ADMIN 아니면 /admin 접근 금지
  if (role !== "ADMIN") {
    const url = req.nextUrl.clone();
    // SALES면 주문 페이지로 돌려보내기
    url.pathname = "/orders";
    return NextResponse.redirect(url);
  }

  // 3) ADMIN이면 통과
  return NextResponse.next();
}

// ✅ 미들웨어가 걸릴 경로 지정 (필수)
export const config = {
  matcher: ["/admin/:path*"],
};


