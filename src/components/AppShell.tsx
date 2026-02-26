"use client";

import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ✅ 로그인 화면에서는 상단바 숨김
  const hideHeader = pathname === "/login";

  return (
    <div className="min-h-screen bg-white">
      {!hideHeader && (
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="text-sm font-semibold">ERP Mini</div>
            <div className="flex items-center gap-2">
              <LogoutButton />
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
