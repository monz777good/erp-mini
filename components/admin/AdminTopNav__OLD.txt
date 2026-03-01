"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
      className={[
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AdminTopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ 현재 status 유지하고 싶으면 여기서 사용 (지금은 기본 PENDING으로 고정)
  const status = searchParams.get("status") ?? "PENDING";

  const isOrders = pathname.startsWith("/admin/orders");
  const isItems = pathname.startsWith("/admin/items");

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-base font-bold">ERP Mini</div>
          <div className="flex items-center gap-2">
            <TabLink
              href={`/admin/orders?status=${status}`}
              label="주문"
              active={isOrders}
            />
            <TabLink href="/admin/items" label="품목" active={isItems} />
          </div>
        </div>

        {/* 오른쪽 영역(나중에 로그아웃/사용자 표시 자리) */}
        <div className="text-xs text-gray-500">ADMIN</div>
      </div>
    </header>
  );
}
