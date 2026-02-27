"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const path = usePathname();
  const active = path === href || path.startsWith(href + "/");

  return (
    <Link
      href={href}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        fontWeight: 800,
        textDecoration: "none",
        background: active ? "rgba(255,255,255,0.16)" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  async function logout() {
    // 너 프로젝트에 /api/auth/logout or /api/logout 둘 다 있을 수 있어서 둘 다 시도
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* 상단바 */}
      <div className="erp-topnav">
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 14px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 900 }}>한의원외인탕전</span>
            <NavLink href="/admin/dashboard" label="대시보드" />
            <NavLink href="/admin/orders" label="관리자 주문" />
            <NavLink href="/admin/items" label="품목관리" />
            <NavLink href="/admin/clients" label="거래처/사업자등록증" />
          </div>

          <button
            onClick={logout}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 900,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(0,0,0,0.25)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 14px" }}>
        {children}
      </div>
    </div>
  );
}