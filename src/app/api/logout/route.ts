import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function doLogout(req: Request) {
  // 1) 기존 세션 제거 로직 (있으면 이게 1순위)
  try {
    clearSession();
  } catch {}

  // 2) Next 16 대응: cookies()가 Promise일 수 있어서 await
  try {
    const c = await cookies();

    // ✅ 네 프로젝트에서 쓰는 쿠키 이름들 (하나라도 맞으면 지워짐)
    c.delete("erp_session");
    c.delete("session");
    c.delete("iron-session");
  } catch {}

  // 3) 로그인으로 강제 이동 (GET/POST 모두 동일하게)
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function GET(req: Request) {
  return doLogout(req);
}

export async function POST(req: Request) {
  return doLogout(req);
}