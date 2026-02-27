import "./globals.css";

export const metadata = {
  title: "ERP",
  description: "ERP Mini",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* ✅ 전역 배경 오버레이 (모든 페이지 공통) */}
        <div className="erp-bg-overlay" />
        {children}
      </body>
    </html>
  );
}