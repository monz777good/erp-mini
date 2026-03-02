import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "한의N원외탕전",
  description: "ERP MINI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="bg-grain" />
        {children}
      </body>
    </html>
  );
}