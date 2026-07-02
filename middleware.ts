import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};

const SESSION_COOKIE = "erp_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  const isLogin = pathname === "/login" || pathname.startsWith("/login/");
  const isAdminArea = pathname.startsWith("/admin");
  const isSalesArea = pathname.startsWith("/orders") || pathname.startsWith("/clients");

  if (isLogin) return NextResponse.next();

  if (!token && (isAdminArea || isSalesArea)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
