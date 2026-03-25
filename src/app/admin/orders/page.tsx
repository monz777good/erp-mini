"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  createdAt: string;
  itemName: string;
  quantityText: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "DONE";

  salesName: string;
  salesPhone: string;

  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;

  clientName: string;
  careInstitutionNo?: string | null;
  note?: string | null;
  specYN?: string | null;
};

const STATUS_LABEL: Record<Row["status"], string> = {
  REQUESTED: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
  DONE: "출고완료",
};

function kstTodayYmd() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}
function addDaysYmd(ymd: string, delta: number) {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<Row["status"]>("REQUESTED");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const today = kstTodayYmd();
    setTo(today);
    setFrom(addDaysYmd(today, -1));
  }, []);

  const count = useMemo(() => rows.length, [rows]);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const params = new URLSearchParams();
      params.set("status", tab);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.message || data?.error || `HTTP_${res.status}`);

      setRows(data.rows || []);
    } catch (e: any) {
      setMsg(e?.message || "조회 실패");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, next: Row["status"]) {
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.message || data?.error || `HTTP_${res.status}`);
      await load();
    } catch (e: any) {
      alert("상태변경 실패\n" + (e?.message || ""));
    }
  }

  async function exportLozen() {
    setMsg(null);

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const candidates = [
      `/api/admin/lozen/export?${params.toString()}`,
      `/api/admin/lozen?${params.toString()}`,
    ];

    try {
      let lastStatus = 0;
      let lastText = "";

      for (const url of candidates) {
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          const blob = await res.blob();
          const dlUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = dlUrl;
          a.download = `lozen_${from}_${to}.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(dlUrl);
          return;
        }

        lastStatus = res.status;
        lastText = await res.text().catch(() => "");
      }

      alert(`로젠 출력 실패\nHTTP_${lastStatus}\n${lastText || ""}`);
    } catch (e: any) {
      alert("로젠 출력 실패\n" + (e?.message || "NETWORK_ERROR"));
    }
  }

  const shell: React.CSSProperties = {
    minHeight: "100vh",
    padding: 28,
    background:
      "radial-gradient(1200px 700px at 20% 20%, rgba(120,105,255,0.22), transparent 55%), radial-gradient(900px 600px at 80% 30%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(900px 700px at 50% 90%, rgba(255,255,255,0.08), transparent 55%), linear-gradient(180deg, rgb(8,10,18), rgb(12,14,24))",
    color: "rgba(255,255,255,0.95)",
  };
  const card: React.CSSProperties = {
    maxWidth: 1280,
    margin: "0 auto",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 35px 120px rgba(0,0,0,0.55)",
    padding: 22,
    backdropFilter: "blur(20px)",
  };
  const title: React.CSSProperties = { fontSize: 30, fontWeight: 950, marginBottom: 6 };
  const sub: React.CSSProperties = { opacity: 0.75, marginBottom: 16, fontWeight: 800 };

  const tabRow: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 };
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.10)",
    color: active ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.92)",
    fontWeight: 950,
    cursor: "pointer",
  });

  const controls: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "160px 30px 160px 1fr 110px 140px",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
  };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    fontWeight: 900,
  };
  const btn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const lozenBtn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(34,197,94,0.28)",
    background: "rgba(34,197,94,0.16)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const tableWrap: React.CSSProperties = {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.12)",
    overflow: "auto",
    background: "rgba(255,255,255,0.05)",
  };
  const th: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: "rgba(20,24,40,0.85)",
    backdropFilter: "blur(10px)",
    textAlign: "left",
    padding: "12px 12px",
    fontWeight: 950,
    fontSize: 13,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "12px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "top",
    fontWeight: 850,
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
  };

  const actionBtn = (tone: "ok" | "no"): React.CSSProperties => ({
    padding: "10px 12px",
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
          기간 조회는 <b>한국시간 기준</b> / 현재 탭: <b>{STATUS_LABEL[tab]}</b> / 건수: <b>{count}</b>
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색 (품목/수하인/거래처/요양기관/영업/전화/비고/명세서)" style={input} />
          <button onClick={load} style={btn} disabled={loading}>
            {loading ? "조회중" : "조회"}
          </button>

          {tab === "APPROVED" ? (
            <button onClick={exportLozen} style={lozenBtn}>
              로젠 출력
            </button>
          ) : (
            <div />
          )}
        </div>

        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1320 }}>
            <thead>
              <tr>
                {["등록일", "품목", "수량", "명세서", "영업사원", "영업전화", "수하인", "주소", "전화", "핸드폰", "거래처", "요양기관번호", "비고", "작업"].map((h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ ...td, textAlign: "center", opacity: 0.7, padding: 18 }}>
                    표시할 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.createdAt}</td>
                    <td style={{ ...td, whiteSpace: "pre-line" }}>{r.itemName}</td>
                    <td style={{ ...td, whiteSpace: "pre-line" }}>{r.quantityText}</td>
                    <td style={td}>{r.specYN || "-"}</td>
                    <td style={td}>{r.salesName}</td>
                    <td style={td}>{r.salesPhone}</td>
                    <td style={td}>{r.receiverName}</td>
                    <td style={td}>{r.receiverAddr}</td>
                    <td style={td}>{r.phone || ""}</td>
                    <td style={td}>{r.mobile || ""}</td>
                    <td style={td}>{r.clientName}</td>
                    <td style={td}>{r.careInstitutionNo || ""}</td>
                    <td style={td}>{r.note || ""}</td>

                    <td style={{ ...td, width: 180 }}>
                      {tab === "REQUESTED" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={actionBtn("ok")} onClick={() => setStatus(r.id, "APPROVED")}>
                            승인
                          </button>
                          <button style={actionBtn("no")} onClick={() => setStatus(r.id, "REJECTED")}>
                            거절
                          </button>
                        </div>
                      ) : (
                        <div style={{ opacity: 0.6, fontWeight: 900 }}>-</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, opacity: 0.55, fontWeight: 800, fontSize: 12 }}>
          * “승인/거절”은 “대기” 탭에서만 버튼이 보입니다.
        </div>
      </div>
    </div>
  );
}