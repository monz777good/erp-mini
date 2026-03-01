import "./globals.css";

export const metadata = {
  title: "한의N원외탕전 ERP",
  description: "한의N원외탕전 ERP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="erp-page">
          {/* ✅ 모든 라우트(로그인/영업사원/기타) 무조건 카드 안에 */}
          <div className="erp-shell">
            <div className="erp-card">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}