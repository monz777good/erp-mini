import Link from "next/link";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header
        style={{
          height: 64,
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* ✅ 왼쪽 상단 로고 */}
          <Link href="/orders" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <span style={{ fontWeight: 1000, fontSize: 16 }}>한의N원외탕전</span>
              <span style={{ fontWeight: 800, fontSize: 11, opacity: 0.6 }}>
                Sales Order
              </span>
            </div>
          </Link>

          {/* (선택) 메뉴가 필요하면 여기에 추가 가능 */}
          <nav style={{ display: "flex", gap: 14, fontWeight: 900 }}>
            <Link href="/orders">주문</Link>
          </nav>
        </div>

        {/* ✅ 로그아웃 */}
        <a href="/api/auth/logout?redirect=/login" style={{ fontWeight: 900 }}>
          로그아웃
        </a>
      </header>

      <main>{children}</main>
    </div>
  );
}