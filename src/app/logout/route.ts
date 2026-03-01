import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ 세션 쿠키 이름(대부분 이거)
// 만약 너가 다른 쿠키명을 쓰면 여기만 바꿔.
const SESSION_COOKIE = "erp_session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/login";
  url.search = "";

  const res = NextResponse.redirect(url);

  // ✅ 쿠키 삭제
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}