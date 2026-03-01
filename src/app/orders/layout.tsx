import Link from "next/link";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="erp-page">
      <header className="erp-topbar">
        <div className="erp-topbar-inner">
          <Link className="erp-brand" href="/orders">
            한의N원외탕전 ERP
          </Link>

          <div style={{ flex: 1 }} />

          {/* ✅ 로그아웃은 GET /logout */}
          <Link className="erp-logout" href="/logout">
            로그아웃
          </Link>
        </div>
      </header>

      <div className="erp-shell">
        <div className="erp-card">{children}</div>
      </div>
    </div>
  );
}