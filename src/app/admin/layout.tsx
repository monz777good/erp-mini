import Link from "next/link";

export const runtime = "nodejs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="erp-topnav">
        <div className="erp-topnav-inner">
          <div className="erp-brand">한의N원외탕전</div>

          <nav className="erp-navlinks">
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

          {/* ✅ /api/logout 이 라우트가 목록에 있어서 그걸로 연결 (GET 방식이라 버튼/링크로 안전) */}
          <a className="erp-logout" href="/api/logout">
            로그아웃
          </a>
        </div>
      </header>

      <main className="erp-main">{children}</main>
    </>
  );
}