"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function active(pathname: string, href: string) {
  if (href === "/admin/orders") return pathname === "/admin" || pathname.startsWith("/admin/orders");
  return pathname.startsWith(href);
}

export default function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() =>
      fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => null)
    );
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/admin/orders", label: "주문(대시보드)" },
    { href: "/admin/items", label: "품목" },
    { href: "/admin/clients", label: "거래처/사업자등록증" },
    { href: "/admin/inventory", label: "재고관리" },
  ];

  return (
    <div className="topbar">
      <div className="brand">한의N원외탕전 ERP</div>

      <nav className="tabs" aria-label="관리자 메뉴">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`tab ${active(pathname, l.href) ? "on" : ""}`}>
            {l.label}
          </Link>
        ))}
      </nav>

      <button className="logout" onClick={logout}>
        로그아웃
      </button>
    </div>
  );
}