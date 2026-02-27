// ✅ 경로: src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "ERP",
  description: "ERP Mini",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}