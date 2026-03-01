export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg">
      <div className="app-inner">
        <div className="page-wrap">
          <div className="topbar" style={{ marginBottom: 14 }}>
            <div className="brand">한의N원외탕전 ERP</div>

            <div className="tabs">
              <a className="tab" href="/admin/orders">주문(대시보드)</a>
              <a className="tab" href="/admin/items">품목</a>
              <a className="tab" href="/admin/clients">거래처/사업자등록증</a>
              <a className="tab" href="/admin/inventory">재고관리</a>
            </div>

            <div className="right-actions">
              <a className="btn" href="/api/logout">로그아웃</a>
            </div>
          </div>

          <div className="card-soft">{children}</div>
        </div>
      </div>
    </div>
  );
}