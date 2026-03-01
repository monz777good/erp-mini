import type { ReactNode } from "react";
import "./globals.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        {/* ✅ 전체 배경 유지 */}
        <div className="min-h-screen bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat">
          {/* ✅ 어둡게 + 살짝 블러(고급스러운 톤) */}
          <div className="min-h-screen bg-black/35 backdrop-blur-[1px]">
            {/* ✅ 중앙 정렬 컨테이너 */}
            <div className="min-h-screen flex items-start justify-center px-4 py-10">
              {/* 페이지별 카드/레이아웃은 각 페이지(AppShell)에서 처리 */}
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}