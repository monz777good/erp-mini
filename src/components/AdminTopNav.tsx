"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cls(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

const tabs = [
  { href: "/admin/orders", label: "주문관리" },
  { href: "/admin/clients", label: "거래처" },
  { href: "/admin/ecount-clients", label: "기존 거래처" },
  { href: "/admin/items", label: "품목" },
  { href: "/admin/stock", label: "재고" },
  { href: "/orders", label: "영업 화면" },
];

export default function AdminTopNav() {
  const pathname = usePathname();

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/login";
    }
  }

  const tab = (href: string) =>
    cls(
      "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-extrabold transition",
      pathname === href
        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
        : "border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
    );

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/orders" className="text-2xl font-black tracking-tight text-slate-950">
            관리자
          </Link>
          <div className="mt-1 text-sm font-bold text-slate-500">
            주문, 거래처, 품목, 재고를 한 곳에서 관리합니다.
          </div>
        </div>

        <button
          onClick={logout}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          로그아웃
        </button>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link key={t.href} className={tab(t.href)} href={t.href}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
