"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
      )}
    >
      {label}
    </Link>
  );
}

export default function AdminTopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const status = searchParams.get("status") ?? "PENDING";

  const isOrders = pathname.startsWith("/admin/orders");
  const isItems = pathname.startsWith("/admin/items");

  async function onLogout() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // 쿠키 삭제 반영 + 화면 정리
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-base font-bold">ERP Mini</div>

          <nav className="flex items-center gap-2">
            <TabLink
              href={`/admin/orders?status=${status}`}
              label="주문"
              active={isOrders}
            />
            <TabLink href="/admin/items" label="품목" active={isItems} />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">ADMIN</div>
          <button
            onClick={onLogout}
            disabled={loading}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              loading
                ? "bg-gray-200 text-gray-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
          >
            {loading ? "로그아웃..." : "로그아웃"}
          </button>
        </div>
      </div>
    </header>
  );
}
