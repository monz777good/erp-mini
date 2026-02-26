import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ Edge Middleware에서는 Node 모듈(crypto) 쓰면 터짐
// ✅ 여기서는 그냥 통과만 시킨다 (권한 체크는 API/페이지에서 처리)
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

// 정적파일/next 내부 제외하고 전부 통과
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};