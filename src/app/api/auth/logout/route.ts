import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ 너 프로젝트 세션 쿠키 이름 (대부분 이거)
// 만약 너 session.ts에서 쿠키명이 다르면 여기만 바꿔.
const SESSION_COOKIE = "erp_session";

export async function POST(req: Request) {
  // ✅ 현재 도메인 기준으로 /login으로 리다이렉트 (Vercel에서도 안전)
  const url = new URL(req.url);
  url.pathname = "/login";
  url.search = "";

  const res = NextResponse.redirect(url);

  // ✅ 세션 쿠키 삭제
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}

// (옵션) 혹시 누가 GET으로 들어오면 안내 없이 /login 보내버림
export async function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/login";
  url.search = "";

  const res = NextResponse.redirect(url);
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}