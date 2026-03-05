import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // ✅ 권한 체크는 각 API route(requireUser/requireAdmin)에서 처리
  // middleware는 일단 패스(빌드 오류 제거)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};