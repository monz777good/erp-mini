"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SalesTopNav() {
  const pathname = usePathname();

  const links = [
    { href: "/orders", label: "주문" },
    { href: "/orders?mode=view", label: "조회" },
    { href: "/clients/new", label: "거래처등록" },
  ];

  return (
    <header className="erp-topnav-light">
      <div className="erp-topnav-inner">

        <div>
          <div className="erp-brand-title-light">한의N원외탕전</div>
          <div className="erp-brand-sub">Sales Order</div>
        </div>

        <nav className="erp-nav">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href.split("?")[0]);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`erp-pill erp-pill-light ${active ? "erp-pill-light-active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="erp-logout"
          style={{ background:"#111", color:"#fff" }}
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