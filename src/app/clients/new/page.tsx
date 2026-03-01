"use client";

import PageShell from "@/components/PageShell";

export default function ClientNewPage() {
  return (
    <PageShell
      title="한의N원외탕전 ERP"
      tabs={[
        { label: "주문", href: "/orders" },
        { label: "조회", href: "/orders?tab=history" },
        { label: "거래처 등록", href: "/clients/new" },
      ]}
      showLogout={true}
      onLogout={async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        location.href = "/login";
      }}
      errorText={null}
    >
      <div className="erp-section-title">거래처 등록</div>
      <div className="erp-help">
        지금은 404 방지용 화면입니다. (다음 단계에서 “거래처 등록 폼”을 완성형으로
        붙입니다)
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="erp-primary" onClick={() => history.back()}>
          뒤로가기
        </button>
      </div>
    </PageShell>
  );
}