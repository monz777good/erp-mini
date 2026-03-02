"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/orders", label: "주문" },
  { href: "/admin/items", label: "품목" },
  { href: "/admin/clients", label: "거래처" },
  { href: "/admin/biz", label: "사업자등록증" },
  { href: "/admin/stock", label: "재고관리" },
];

export default function AdminTopNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-white">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="flex items-center justify-between py-3">
          <div className="text-lg sm:text-xl font-black text-black">
            한의N원외탕전 <span className="text-sm font-extrabold text-gray-500">관리자</span>
          </div>
        </div>

        {/* ✅ 모바일도 슬라이드/스와이프 아니라 “누르면 이동” */}
        <div className="grid grid-cols-5 gap-2 pb-3">
          {tabs.map((t) => {
            const active =
              pathname === t.href || (t.href !== "/admin/orders" && pathname.startsWith(t.href));

            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "rounded-xl border text-center py-2 text-xs sm:text-sm font-black",
                  "bg-white",
                  active ? "border-black text-black" : "border-gray-200 text-gray-600",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}