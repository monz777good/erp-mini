"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cls(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

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
      "px-4 py-2 rounded-full text-sm font-semibold transition border",
      pathname === href
        ? "bg-white text-black border-white"
        : "bg-white/10 text-white border-white/15 hover:bg-white/15"
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-white">관리자</div>
          <div className="text-white/60 text-sm mt-1">
            주문/거래처/품목/재고 관리
          </div>
        </div>

        <button
          onClick={logout}
          className="h-[44px] rounded-xl px-4 py-3 font-semibold transition border border-white/15 bg-white/15 hover:bg-white/20 active:scale-[0.99] text-white"
        >
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap gap-2">
        <Link className={tab("/admin")} href="/admin">
          대시보드
        </Link>

        <Link className={tab("/admin/orders")} href="/admin/orders">
          주문관리
        </Link>

        <Link className={tab("/admin/clients")} href="/admin/clients">
          거래처
        </Link>
ㄴ
        <Link className={tab("/admin/ecount-clients")} href="/admin/ecount-clients">
          기존 거래처 목록
        </Link>

        <Link className={tab("/admin/items")} href="/admin/items">
          품목
        </Link>

        <Link className={tab("/admin/stock")} href="/admin/stock">
          재고
        </Link>

        <Link className={tab("/orders")} href="/orders">
          영업 화면
        </Link>
      </div>
    </div>
  );
}