"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/orders", label: "관리자 주문" },
  { href: "/admin/items", label: "품목관리" },
  { href: "/admin/clients", label: "거래처/사업자등록증" },
  { href: "/admin/stock", label: "재고관리" }, // ✅ 추가
];

export default function AdminTopNav() {
  const pathname = usePathname();

  const bar: React.CSSProperties = {
    display: "flex",
    gap: 14,
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 50,
  };

  const brand: React.CSSProperties = {
    fontWeight: 900,
    fontSize: 14,
    marginRight: 8,
    whiteSpace: "nowrap",
  };

  const linkBase: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const active: React.CSSProperties = {
    ...linkBase,
    background: "#111827",
    color: "#fff",
  };

  const right: React.CSSProperties = { marginLeft: "auto", display: "flex", gap: 8 };

  async function logout() {
    await fetch("/api/auth/logout", { credentials: "include" });
    location.href = "/login";
  }

  return (
    <div style={bar}>
      <div style={brand}>한의N원외탕전</div>

      {nav.map((x) => {
        const isActive =
          pathname === x.href || (x.href !== "/admin/dashboard" && pathname?.startsWith(x.href));
        return (
          <Link key={x.href} href={x.href} style={isActive ? active : linkBase}>
            {x.label}
          </Link>
        );
      })}

      <div style={right}>
        <button
          onClick={logout}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #111827",
            background: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}