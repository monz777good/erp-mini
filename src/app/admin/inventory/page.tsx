export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <div className="erp-overlay">
      <div className="erp-shell">
        <div className="erp-shell-inner">
          <div className="erp-card">
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10 }}>
              재고관리
            </h1>
            <p style={{ fontSize: 15, color: "#333", fontWeight: 800 }}>
              재고관리 화면 정상 동작 확인 완료 (라우팅/권한/레이아웃 OK)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}