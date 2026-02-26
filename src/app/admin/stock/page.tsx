"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  name: string;
  packV: number;
  stockV: number;
};

export default function AdminStockPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // 입력값(행별)
  const [packMap, setPackMap] = useState<Record<string, string>>({});
  const [addMap, setAddMap] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stock", { credentials: "include" });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      // pack 입력칸 기본값 세팅
      const nextPack: Record<string, string> = {};
      for (const it of Array.isArray(data) ? data : []) {
        nextPack[it.id] = String(it.packV ?? 1);
      }
      setPackMap(nextPack);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim();
    if (!qq) return rows;
    return rows.filter((r) => r.name.includes(qq));
  }, [rows, q]);

  async function save(id: string) {
    const packV = Number(packMap[id] ?? "1");
    const addV = Number(addMap[id] ?? "0");

    if (!Number.isFinite(packV) || packV <= 0) {
      alert("묶음(V)은 1 이상 숫자만 가능해요.");
      return;
    }
    if (!Number.isFinite(addV) || addV < 0) {
      alert("추가재고(V)는 0 이상 숫자만 가능해요.");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id,
          packV: Math.floor(packV),
          addV: Math.floor(addV),
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        alert("저장 실패\n" + t);
        return;
      }

      const updated: Row = await res.json();

      // 화면 즉시 반영 + 추가재고 칸 0으로 초기화
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setAddMap((prev) => ({ ...prev, [id]: "" }));
      alert("저장 완료 (보유재고가 누적 반영됐어요)");
    } finally {
      setSavingId(null);
    }
  }

  const th: React.CSSProperties = {
    textAlign: "left",
    fontWeight: 900,
    fontSize: 13,
    padding: "14px 14px",
    borderBottom: "1px solid #eee",
    color: "#111",
    background: "#fafafa",
  };

  const td: React.CSSProperties = {
    padding: "14px 14px",
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "middle",
    fontSize: 14,
  };

  const input: React.CSSProperties = {
    width: 120,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e5e5",
    outline: "none",
    fontSize: 14,
    fontWeight: 800,
    textAlign: "center",
  };

  const readonly: React.CSSProperties = {
    ...input,
    background: "#f6f6f6",
    color: "#111",
  };

  const btn: React.CSSProperties = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "0",
    background: "#111",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    minWidth: 80,
  };

  const btnDisabled: React.CSSProperties = {
    ...btn,
    background: "#999",
    cursor: "not-allowed",
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 1000, fontSize: 22 }}>재고관리</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#666", fontWeight: 700 }}>
            보유재고는 V로 입력 / 묶음(V) = “상품 1개 주문 시 차감될 V” (예: 2ml=30, 20ml=5)
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="품목 검색"
            style={{
              width: 260,
              padding: "11px 14px",
              borderRadius: 12,
              border: "1px solid #e5e5e5",
              fontWeight: 800,
            }}
          />
          <button onClick={load} style={btn} disabled={loading}>
            새로고침
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th, width: "40%" }}>품목명</th>
              <th style={{ ...th, width: 160, textAlign: "center" }}>묶음(V)</th>
              <th style={{ ...th, width: 180, textAlign: "center" }}>보유재고(V)</th>
              <th style={{ ...th, width: 180, textAlign: "center" }}>추가재고(V)</th>
              <th style={{ ...th, width: 120, textAlign: "center" }}>저장</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td style={{ ...td, color: "#777" }} colSpan={5}>
                  표시할 품목이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...td, fontWeight: 900 }}>{r.name}</td>

                  <td style={{ ...td, textAlign: "center" }}>
                    <input
                      style={input}
                      inputMode="numeric"
                      value={packMap[r.id] ?? String(r.packV ?? 1)}
                      onChange={(e) => setPackMap((p) => ({ ...p, [r.id]: e.target.value.replace(/[^\d]/g, "") }))}
                      placeholder="예: 30"
                    />
                  </td>

                  <td style={{ ...td, textAlign: "center" }}>
                    <input style={readonly} value={String(r.stockV ?? 0)} readOnly />
                  </td>

                  <td style={{ ...td, textAlign: "center" }}>
                    <input
                      style={input}
                      inputMode="numeric"
                      value={addMap[r.id] ?? ""}
                      onChange={(e) => setAddMap((p) => ({ ...p, [r.id]: e.target.value.replace(/[^\d]/g, "") }))}
                      placeholder="예: 100"
                    />
                  </td>

                  <td style={{ ...td, textAlign: "center" }}>
                    <button
                      onClick={() => save(r.id)}
                      style={savingId === r.id ? btnDisabled : btn}
                      disabled={savingId === r.id}
                    >
                      {savingId === r.id ? "저장중" : "저장"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#666", fontWeight: 700 }}>
        * 재고 자동 차감은 로젠 출력(출고처리) 시점에 발생합니다.
      </div>
    </div>
  );
}