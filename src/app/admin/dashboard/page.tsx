"use client";

import { useEffect, useState } from "react";

type Stats = {
  total: number;
  requested: number;
  approved: number;
  rejected: number;
  done: number;
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  borderRadius: 18,
  padding: 18,
  minHeight: 92,
  boxShadow: "0 18px 55px rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.65)",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    requested: 0,
    approved: 0,
    rejected: 0,
    done: 0,
  });

  async function refresh() {
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setStats({
          total: Number(data?.total ?? 0),
          requested: Number(data?.requested ?? 0),
          approved: Number(data?.approved ?? 0),
          rejected: Number(data?.rejected ?? 0),
          done: Number(data?.done ?? 0),
        });
      }
    } catch {}
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          {/* ✅ 검은글자 흰테두리 */}
          <div className="erp-outline" style={{ fontSize: 34, marginBottom: 6 }}>
            관리자 대시보드
          </div>
          <div className="erp-outline-sub" style={{ fontSize: 14 }}>
            관리자 전용 화면입니다. (주문/품목/거래처/사업자등록증/재고관리)
          </div>
        </div>

        <button
          onClick={refresh}
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          새로고침
        </button>
      </div>

      <div style={{ height: 14 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <div style={cardStyle}>
          <div className="erp-outline" style={{ fontSize: 16, marginBottom: 4 }}>
            전체
          </div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{stats.total}</div>
        </div>

        <div style={cardStyle}>
          <div className="erp-outline" style={{ fontSize: 16, marginBottom: 4 }}>
            대기
          </div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{stats.requested}</div>
        </div>

        <div style={cardStyle}>
          <div className="erp-outline" style={{ fontSize: 16, marginBottom: 4 }}>
            승인
          </div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{stats.approved}</div>
        </div>

        <div style={cardStyle}>
          <div className="erp-outline" style={{ fontSize: 16, marginBottom: 4 }}>
            거절
          </div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{stats.rejected}</div>
        </div>

        <div style={cardStyle}>
          <div className="erp-outline" style={{ fontSize: 16, marginBottom: 4 }}>
            출고완료
          </div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{stats.done}</div>
        </div>
      </div>
    </div>
  );
}