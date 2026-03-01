import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "한의N원외탕전 ERP",
  description: "ERP Mini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}