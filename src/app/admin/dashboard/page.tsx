"use client";

import { useEffect, useState } from "react";

type Counts = {
  total: number;
  requested: number;
  approved: number;
  rejected: number;
  done: number;
};

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    requested: 0,
    approved: 0,
    rejected: 0,
    done: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErr(data?.message ?? `대시보드 불러오기 실패 (${res.status})`);
        return;
      }
      setCounts(data.counts ?? counts);
    } catch {
      setErr("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "22px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h1 style={{ fontSize: 28, fontWeight: 1000, margin: 0 }}>관리자 대시보드</h1>
        <div style={{ flex: 1 }} />
        <button onClick={load} style={btnPrimary} disabled={loading}>
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      {err && (
        <div style={{ marginBottom: 12, color: "crimson", fontWeight: 900 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
        <Card title="전체" value={counts.total} />
        <Card title="대기" value={counts.requested} />
        <Card title="승인" value={counts.approved} />
        <Card title="거절" value={counts.rejected} />
        <Card title="출고완료" value={counts.done} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 950, opacity: 0.75 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>{Number(value ?? 0)}</div>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "white",
  boxShadow: "0 8px 26px rgba(0,0,0,0.04)",
};

const btnPrimary: React.CSSProperties = {
  border: "1px solid #111",
  background: "#111",
  color: "white",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 950,
  cursor: "pointer",
};