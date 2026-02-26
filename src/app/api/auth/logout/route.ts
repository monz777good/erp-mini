import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirect") || "/login";

  const res = NextResponse.redirect(new URL(redirectTo, url.origin), { status: 302 });

  // ✅ 쿠키 삭제
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}