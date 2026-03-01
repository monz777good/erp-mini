import type { ReactNode } from "react";
import "./globals.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}