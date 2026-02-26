import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionTokenEdge, SESSION_COOKIE } from "@/lib/session-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 정적/Next 내부/업로드 파일/API/이미지는 미들웨어에서 제외
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/images") // ✅ 추가
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await parseSessionTokenEdge(token);

  // ✅ /login은 항상 접근 가능 (로그인 돼있으면 역할에 맞게 보내기)
  if (pathname === "/login") {
    if (user?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (user?.role === "SALES") return NextResponse.redirect(new URL("/orders", req.url));
    return NextResponse.next();
  }

  // ✅ 로그인 안됐으면 /login
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  // ✅ ADMIN 강제
  if (user.role === "ADMIN") {
    if (pathname === "/" || pathname === "/orders") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ✅ SALES는 /admin 금지
  if (user.role === "SALES") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/orders", req.url));
    }
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/orders", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // ✅ uploads/images는 미들웨어 대상에서 제외(이중 안전)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|images).*)"],
};