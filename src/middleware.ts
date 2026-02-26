import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUserEdge } from "@/lib/session-edge";

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 로그인 페이지는 통과
  if (pathname.startsWith("/login")) return NextResponse.next();

  const user = await getSessionUserEdge(req);

  // 로그인 안 했으면 /login으로
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // /admin은 ADMIN만
  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/orders";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}