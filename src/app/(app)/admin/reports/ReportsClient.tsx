"use client";

import { useMemo, useState } from "react";

type Summary = {
  count: number;
  totalQty: number;
  topItems: { name: string; count: number; qty: number }[];
};

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstDayOfThisMonthYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export default function ReportsClient() {
  const [start, setStart] = useState(firstDayOfThisMonthYMD());
  const [end, setEnd] = useState(todayYMD());

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const qp = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("start", start);
    sp.set("end", end);
    return sp.toString();
  }, [start, end]);

  async function download(url: string, filename: string) {
    setLoading(true);
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg?.message ?? "다운로드 실패");
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary() {
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/summary?${qp}`, { credentials: "include" });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg?.message ?? "조회 실패");
        return;
      }
      const data = (await res.json()) as Summary;
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  }

  const card: React.CSSProperties = {
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 16,
    background: "white",
  };

  const label: React.CSSProperties = { fontWeight: 900, marginBottom: 6 };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 12,
    outline: "none",
  };

  const btnBlack: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  };

  const btn: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
    color: "#111",
    fontWeight: 900,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: 20, maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>리포트 (출고완료만)</h1>
      <div style={{ color: "#666", fontWeight: 800, marginBottom: 14 }}>
        ✅ 상태 = <b>DONE(출고완료)</b> 주문만 기간으로 조회/다운로드
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={label}>시작일</div>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={input} />
            </div>
            <div>
              <div style={label}>종료일</div>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={input} />
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <button disabled={summaryLoading} style={btnBlack} onClick={fetchSummary}>
              {summaryLoading ? "조회중..." : "조회"}
            </button>
          </div>

          <div style={{ marginTop: 12, color: "#777", fontWeight: 800, fontSize: 13 }}>
            기간 기준: createdAt이 <b>시작일 00:00</b> ~ <b>종료일 다음날 00:00</b> 미만
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>엑셀 다운로드</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <button
              disabled={loading}
              style={btnBlack}
              onClick={() => download(`/api/admin/reports/orders-excel?${qp}`, `orders_done_${start}_to_${end}.xlsx`)}
            >
              기간별 주문 엑셀(출고완료 DONE) 다운로드
            </button>

            <button
              disabled={loading}
              style={btn}
              onClick={() => download(`/api/admin/reports/items-excel?${qp}`, `items_done_${start}_to_${end}.xlsx`)}
            >
              품목별 출고 수량 엑셀 다운로드
            </button>

            <div style={{ color: "#666", fontWeight: 800, fontSize: 13 }}>{loading ? "다운로드 준비 중..." : "정상"}</div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>조회 결과</div>

          {!summary ? (
            <div style={{ color: "#777", fontWeight: 800 }}>조회 버튼을 눌러 확인하세요.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                  <div style={{ color: "#666", fontWeight: 900 }}>출고건수</div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.count}</div>
                </div>
                <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                  <div style={{ color: "#666", fontWeight: 900 }}>출고수량 합계</div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{summary.totalQty}</div>
                </div>
              </div>

              <div style={{ fontWeight: 900, marginBottom: 8 }}>품목 TOP 10</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>품목</th>
                      <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #eee" }}>건수</th>
                      <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #eee" }}>수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: 12, color: "#777" }}>
                          기간 내 출고완료(DONE) 데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      summary.topItems.map((r) => (
                        <tr key={r.name}>
                          <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.name}</td>
                          <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>{r.count}</td>
                          <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2", textAlign: "right" }}>{r.qty}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}