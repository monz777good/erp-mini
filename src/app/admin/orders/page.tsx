// src/app/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "DONE";
  quantity: number;
  createdAt: string;

  itemName: string;
  salesName: string;
  salesPhone: string;

  receiverName: string;
  receiverAddr: string;
  phone: string;
  mobile: string;

  clientName: string;
  careInstitutionNo: string;

  note: string;
};

function ymdKST(d = new Date()) {
  // 한국시간 기준 YYYY-MM-DD
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<Row["status"], string> = {
  REQUESTED: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
  DONE: "출고완료",
};

export default function AdminOrdersPage() {
  const today = ymdKST();

  const [tab, setTab] = useState<Row["status"]>("REQUESTED");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState<string | null>(null);

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("status", tab);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      if (q.trim()) qs.set("q", q.trim());

      const res = await fetch(`/api/admin/orders?${qs.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setRows([]);
        setMsg(data?.message || `조회 실패 (${res.status})`);
        return;
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, status: Row["status"]) {
    setMsg("");
    setChanging(id);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg(data?.message || `상태변경 실패 (${res.status})`);
        return;
      }

      // ✅ 즉시 반영: 해당 row 상태 갱신 + 현재 탭과 다르면 제거
      setRows((prev) =>
        prev
          .map((r) => (r.id === id ? { ...r, status } : r))
          .filter((r) => r.status === tab)
      );
    } finally {
      setChanging(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const count = rows.length;

  // ===== 스타일(다크 통일) =====
  const shell: React.CSSProperties = {
    padding: 24,
  };

  const card: React.CSSProperties = {
    borderRadius: 26,
    padding: 22,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(12px)",
    color: "rgba(255,255,255,0.92)",
  };

  const title: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 950,
    marginBottom: 8,
  };

  const sub: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 800,
    opacity: 0.75,
    marginBottom: 14,
  };

  const tabRow: React.CSSProperties = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.06)",
    color: active ? "#0b1220" : "rgba(255,255,255,0.92)",
    fontWeight: 950,
    cursor: "pointer",
  });

  const controls: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "140px 24px 140px 1fr 120px",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 900,
    outline: "none",
  };

  const btn: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 950,
    cursor: "pointer",
  };

  const tableWrap: React.CSSProperties = {
    borderRadius: 18,
    overflowX: "auto",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  };

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: 12,
    fontSize: 12,
    fontWeight: 950,
    color: "rgba(255,255,255,0.75)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  };

  const td: React.CSSProperties = {
    padding: 12,
    fontSize: 13,
    fontWeight: 850,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "top",
  };

  const miniBtn = (tone: "ok" | "bad"): React.CSSProperties => ({
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: tone === "ok" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div style={shell}>
      <div style={card}>
        <div style={title}>관리자 주문 목록</div>
        <div style={sub}>
          기간 조회는 <b>한국시간 기준</b>으로 처리됩니다. / 현재 탭: <b>{STATUS_LABEL[tab]}</b> / 건수: <b>{count}</b>
        </div>

        {msg ? (
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 14, background: "rgba(239,68,68,0.16)", fontWeight: 950 }}>
            {msg}
          </div>
        ) : null}

        <div style={tabRow}>
          {(["REQUESTED", "APPROVED", "REJECTED", "DONE"] as Row["status"][]).map((s) => (
            <button key={s} onClick={() => setTab(s)} style={tabBtn(tab === s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div style={controls}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={input} />
          <div style={{ textAlign: "center", opacity: 0.8, fontWeight: 950 }}>~</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={input} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색 (품목명/수화인/거래처/요양기관번호/영업/전화/비고)"
            style={input}
          />
          <button onClick={load} style={btn} disabled={loading}>
            {loading ? "조회중" : "조회"}
          </button>
        </div>

        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr>
                {["등록일", "품목", "수량", "영업사원", "전화번호", "수화인", "주소", "전화", "핸드폰", "거래처", "요양기관번호", "비고", "작업"].map(
                  (h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ ...td, textAlign: "center", opacity: 0.7, padding: 18 }}>
                    표시할 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.createdAt.slice(0, 10)}</td>
                    <td style={{ ...td, fontWeight: 950 }}>{r.itemName || "-"}</td>
                    <td style={td}>{r.quantity}</td>
                    <td style={td}>{r.salesName || "-"}</td>
                    <td style={td}>{r.salesPhone || "-"}</td>
                    <td style={td}>{r.receiverName}</td>
                    <td style={{ ...td, maxWidth: 260 }}>{r.receiverAddr}</td>
                    <td style={td}>{r.phone || "-"}</td>
                    <td style={td}>{r.mobile || "-"}</td>
                    <td style={td}>{r.clientName || "-"}</td>
                    <td style={td}>{r.careInstitutionNo || "-"}</td>
                    <td style={{ ...td, maxWidth: 220 }}>{r.note || "-"}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      {tab === "REQUESTED" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={miniBtn("ok")}
                            disabled={changing === r.id}
                            onClick={() => changeStatus(r.id, "APPROVED")}
                          >
                            {changing === r.id ? "처리중" : "승인"}
                          </button>
                          <button
                            style={miniBtn("bad")}
                            disabled={changing === r.id}
                            onClick={() => changeStatus(r.id, "REJECTED")}
                          >
                            {changing === r.id ? "처리중" : "거절"}
                          </button>
                        </div>
                      ) : (
                        <span style={{ opacity: 0.75, fontWeight: 900 }}>{STATUS_LABEL[r.status]}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 850, opacity: 0.7 }}>
          * 승인/거절은 “대기” 탭에서만 버튼이 보입니다.
        </div>
      </div>
    </div>
  );
}