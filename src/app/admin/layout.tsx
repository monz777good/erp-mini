import Link from "next/link";

export const runtime = "nodejs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="erp-topnav">
        <div className="erp-topnav-inner">
          <div className="erp-brand">
            <span className="erp-outline-white">한의N원외탕전</span>
          </div>

          <div className="erp-navwrap">
            <nav className="erp-navlinks" aria-label="admin navigation">
              <Link className="erp-navlink" href="/admin/dashboard">
                대시보드
              </Link>
              <Link className="erp-navlink" href="/admin/orders">
                관리자 주문
              </Link>
              <Link className="erp-navlink" href="/admin/items">
                품목관리
              </Link>
              <Link className="erp-navlink" href="/admin/clients">
                거래처/사업자등록증
              </Link>
              <Link className="erp-navlink" href="/admin/stock">
                재고관리
              </Link>
            </nav>
          </div>

          <a className="erp-logout" href="/api/logout">
            로그아웃
          </a>
        </div>
      </header>

      <main className="erp-main">{children}</main>
    </>
  );
}