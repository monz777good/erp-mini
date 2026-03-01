"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode } from "react";

function cx(...v: (string | false | null | undefined)[]) {
  return v.filter(Boolean).join(" ");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = sp.get("tab") ?? "order";

  // ✅ 탭 링크 (Sales)
  const salesTabs = [
    { key: "order", label: "주문", href: "/orders?tab=order" },
    { key: "history", label: "조회", href: "/orders?tab=history" },
    { key: "clients", label: "거래처 등록", href: "/clients/new" },
  ];

  return (
    <div className="min-h-screen w-full bg-[url('/bg.jpg')] bg-cover bg-center">
      {/* 어두운 오버레이 */}
      <div className="min-h-screen w-full bg-black/35">
        <div className="mx-auto max-w-6xl px-4 py-10">
          {/* 카드(글래스) */}
          <div className="rounded-[28px] border border-white/35 bg-white/80 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {/* 상단바 */}
            <div className="flex flex-col gap-4 border-b border-black/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="text-xl font-black tracking-tight text-black/90">
                한의N원외탕전 ERP
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pathname.startsWith("/orders") &&
                  salesTabs.map((t) => {
                    const active =
                      (t.key === "order" && tab === "order") ||
                      (t.key === "history" && tab === "history") ||
                      (t.key === "clients" && pathname.startsWith("/clients"));

                    return (
                      <Link
                        key={t.key}
                        href={t.href}
                        className={cx(
                          "rounded-full px-4 py-2 text-sm font-extrabold transition",
                          active
                            ? "bg-black text-white shadow"
                            : "bg-white/70 text-black/80 hover:bg-white"
                        )}
                      >
                        {t.label}
                      </Link>
                    );
                  })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-full bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white"
                  onClick={() => window.location.reload()}
                >
                  새로고침
                </button>

                <Link
                  className="rounded-full bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white"
                  href="/logout"
                >
                  로그아웃
                </Link>
              </div>
            </div>

            {/* 본문 */}
            <div className="px-6 py-6">{children}</div>
          </div>

          <div className="mt-6 text-center text-xs font-bold text-white/75">
            © 한의N원외탕전
          </div>
        </div>
      </div>
    </div>
  );
}