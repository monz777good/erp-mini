"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "주문" },
  { href: "/admin/items", label: "품목" },
  { href: "/admin/clients", label: "거래처" },
  { href: "/admin/stock", label: "재고관리" },
];

export default function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/admin" className="font-bold tracking-tight text-white">
          한의N원외탕전 ERP MINI (관리자)
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-2">
            {tabs.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={[
                    "rounded-xl px-3 py-2 text-sm",
                    "border border-white/15 bg-white/10",
                    "hover:bg-white/15",
                    active ? "ring-1 ring-white/30" : "",
                  ].join(" ")}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 모바일 탭 */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-3 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "text-center rounded-xl px-2 py-2 text-sm",
                  "border border-white/15 bg-white/10 hover:bg-white/15",
                  active ? "ring-1 ring-white/30" : "",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}