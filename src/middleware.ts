import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "erp_session";

function isPublicPath(pathname: string) {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/api/")) return true; // API는 각 route에서 권한 체크
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images/")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  // 보호할 화면들(너는 AppShell 아래 거의 전부)
  const needAuth =
    pathname.startsWith("/orders") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/admin");

  if (!needAuth) return NextResponse.next();

  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};