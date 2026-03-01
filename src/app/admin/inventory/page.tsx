export default function AdminInventoryPage() {
  return (
    <div className="erp-card">
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>재고관리</h1>
      <div style={{ fontWeight: 700, opacity: 0.75, marginBottom: 18 }}>
        재고 기능은 다음 단계에서 연결합니다. (현재는 페이지 준비중)
      </div>

      <div
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: 18,
          fontWeight: 800,
        }}
      >
        ✅ 여기에는 “품목별 재고수량 / 입출고 기록 / 일괄 조정”이 들어갈 예정입니다.
      </div>
    </div>
  );
}