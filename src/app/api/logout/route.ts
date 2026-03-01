import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // 세션 쿠키 이름이 뭐든 상관없이, 보통 erp_session / session 등
  // 네 프로젝트에서 쓰는 쿠키명에 맞춰 아래 1줄만 바꾸면 됨.
  const res = NextResponse.redirect(new URL("/login", "http://localhost"));

  // ✅ 배포 환경에서도 작동하게 origin 자동 처리
  // (Next가 알아서 host를 채움)
  res.headers.set("Location", "/login");

  // ✅ 쿠키 삭제(쿠키 이름이 다르면 여기를 너 쿠키명으로 바꾸자)
  res.cookies.set("erp_session", "", { path: "/", maxAge: 0 });

  return res;
}