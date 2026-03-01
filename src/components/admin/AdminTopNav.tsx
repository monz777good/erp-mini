"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function isActive(pathname: string, href: string) {
  const base = href.split("?")[0];
  return pathname === base || pathname.startsWith(base + "/");
}

export default function AdminTopNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const status = searchParams?.get("status") ?? "PENDING";

  const links = [
    { href: "/admin/orders?status=" + encodeURIComponent(status), label: "주문(대시보드)" },
    { href: "/admin/items", label: "품목" },
    { href: "/admin/clients", label: "거래처/사업자등록증" },
    { href: "/admin/inventory", label: "재고관리" },
  ];

  return (
    <div className="topbar">
      <div className="brand">한의N원외탕전 ERP</div>

      <nav className="tabs" aria-label="관리자 메뉴">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`tab ${isActive(pathname, l.href) ? "on" : ""}`}>
            {l.label}
          </Link>
        ))}
      </nav>

      <form action="/api/logout" method="post">
        <button className="logout" type="submit">로그아웃</button>
      </form>
    </div>
  );
}