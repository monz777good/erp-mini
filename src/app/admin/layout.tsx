import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStyle: React.CSSProperties = {
    height: 64,
    borderBottom: "1px solid var(--line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  };

  const navStyle: React.CSSProperties = {
    display: "flex",
    gap: 14,
    fontWeight: 900,
  };

  const linkStyle: React.CSSProperties = {
    textDecoration: "none",
    color: "var(--text)",
    padding: "8px 10px",
    borderRadius: 10,
  };

  const btnStyle: React.CSSProperties = {
    textDecoration: "none",
    fontWeight: 900,
    padding: "8px 12px",
    borderRadius: 12,
    background: "var(--brand)",
    color: "white",
  };

  const pageWrap: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "22px 16px",
  };

  // ✅ 여기(공통 카드 컨테이너)가 핵심: 유리카드 느낌
  const cardShell: React.CSSProperties = {
    background: "var(--card)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(221,239,224,0.9)",
    borderRadius: 22,
    boxShadow: "0 20px 45px rgba(0,0,0,0.10)",
    padding: 18,
  };

  return (
    <div>
      {/* 상단 관리자 메뉴 */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* ✅ 브랜드 로고 */}
          <Link href="/admin/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <span style={{ fontWeight: 1000, fontSize: 16 }}>한의N원외탕전</span>
              <span style={{ fontWeight: 800, fontSize: 11, opacity: 0.6 }}>
                관리자 대시보드
              </span>
            </div>
          </Link>

          {/* ✅ 메뉴 */}
          <nav style={navStyle}>
            <Link href="/admin/dashboard" style={linkStyle}>대시보드</Link>
            <Link href="/admin/orders" style={linkStyle}>관리자 주문</Link>
            <Link href="/admin/items" style={linkStyle}>품목관리</Link>
            <Link href="/admin/clients" style={linkStyle}>거래처/사업자등록증</Link>
            <Link href="/admin/stock" style={linkStyle}>재고관리</Link>
          </nav>
        </div>

        {/* ✅ 로그아웃 */}
        <a href="/api/auth/logout?redirect=/login" style={btnStyle}>
          로그아웃
        </a>
      </header>

      {/* 페이지 내용 */}
      <main style={pageWrap}>
        <div style={cardShell}>{children}</div>
      </main>
    </div>
  );
}