import { NextResponse } from "next/server";

function makeLogoutResponse(req: Request) {
  const res = NextResponse.json({ ok: true });

  // ✅ 현재 요청에 실려온 쿠키를 전부 지워버린다 (쿠키이름 몰라도 100% 로그아웃)
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieNames = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => v.split("=")[0]?.trim())
    .filter(Boolean);

  // 중복 제거
  const unique = Array.from(new Set(cookieNames));

  for (const name of unique) {
    // path "/" 로 삭제 (대부분 이걸로 삭제됨)
    res.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
    });

    // ✅ 혹시 path가 다를 때 대비 (Next에서 가끔 /api 경로로 잡히는 경우)
    res.cookies.set({
      name,
      value: "",
      path: "/api",
      maxAge: 0,
    });
  }

  return res;
}

export async function POST(req: Request) {
  return makeLogoutResponse(req);
}

export async function GET(req: Request) {
  return makeLogoutResponse(req);
}
