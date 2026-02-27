"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminTopNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/dashboard", label: "대시보드" },
    { href: "/admin/orders", label: "주문관리" },
    { href: "/admin/items", label: "품목관리" },
    { href: "/admin/clients", label: "거래처" },
    { href: "/admin/stock", label: "재고관리" },
  ];

  return (
    <header className="erp-topnav-dark">
      <div className="erp-topnav-inner">

        <div>
          <div className="erp-brand-title-dark">한의N원외탕전</div>
          <div className="erp-brand-sub" style={{color:"rgba(255,255,255,0.7)"}}>
            Admin System
          </div>
        </div>

        <nav className="erp-nav">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`erp-pill erp-pill-dark ${active ? "erp-pill-dark-active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="erp-logout"
          style={{ background:"#000", color:"#fff" }}
          onClick={()=>{
            fetch("/api/auth/logout",{method:"POST"});
            window.location.href="/login";
          }}
        >
          로그아웃
        </button>

      </div>
    </header>
  );
}