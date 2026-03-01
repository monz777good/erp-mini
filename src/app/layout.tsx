import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "한의N원외탕전 ERP",
  description: "한의N원외탕전 ERP",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="erp-bg">{children}</div>
      </body>
    </html>
  );
}