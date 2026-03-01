"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/admin/orders") return pathname === "/admin" || pathname.startsWith("/admin/orders");
  return pathname.startsWith(href);
}

export default function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    // 둘 중 하나만 있어도 되게 안전하게
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
    <div className="erp-topbar">
      <div className="erp-brand">한의N원외탕전 ERP</div>

      <div className="erp-nav">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={isActive(pathname, l.href) ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </div>

      <button className="erp-logout" onClick={logout}>
        로그아웃
      </button>
    </div>
  );
}