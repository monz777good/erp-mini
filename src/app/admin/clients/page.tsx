"use client";

import { useEffect, useState } from "react";

type ClientRow = {
  id: string;
  createdAt?: string;

  salesName?: string;
  salesPhone?: string;

  name?: string;
  bizNo?: string;
  instNo?: string;
  address?: string;

  phone?: string;
  mobile?: string;
  note?: string;

  bizFileUrl?: string | null;
  bizFileName?: string | null;
};

function todayKST(): string {
  // KST 기준 "YYYY-MM-DD"
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export default function AdminClientsPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const [from, setFrom] = useState(todayKST());
  const [to, setTo] = useState(todayKST());

  async function load() {
    setMsg("");

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/admin/clients?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      setMsg(`조회 실패 (${res.status}) - 관리자 로그인 상태를 확인하세요.`);
      setRows([]);
      return;
    }

    const data = await res.json().catch(() => null);

    // ✅ { ok:true, rows } 형태 지원
    const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
    setRows(list);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: 12,
    fontWeight: 900,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  };

  const td: React.CSSProperties = {
    padding: 12,
    fontWeight: 800,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    fontWeight: 800,
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const linkBtn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div className="erp-shell">
      <div className="erp-card">
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>거래처 / 사업자등록증</h1>
        <div style={{ fontWeight: 700, opacity: 0.8, marginBottom: 14 }}>
          영업사원이 등록한 거래처 + 사업자등록증 업로드 현황을 관리합니다. (한국시간 기준 조회)
        </div>

        {msg ? <div style={{ color: "#ff6b6b", fontWeight: 900, marginBottom: 10 }}>{msg}</div> : null}

        {/* ✅ 기간 + 검색 */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontWeight: 900, opacity: 0.9 }}>기간</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
              }}
            />
            <span style={{ fontWeight: 900, opacity: 0.9 }}>~</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색(거래처/요양기관/사업자번호/영업사원/전화/주소/비고)"
              style={inputStyle}
            />
          </div>

          <button onClick={load} style={btnStyle}>
            새로고침
          </button>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                {[
                  "등록일",
                  "영업사원",
                  "거래처명",
                  "사업자번호",
                  "요양기관번호",
                  "주소",
                  "전화",
                  "핸드폰",
                  "비고",
                  "사업자등록증",
                ].map((h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 18, textAlign: "center", fontWeight: 900, opacity: 0.8 }}>
                    데이터 없음
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.createdAt ? String(r.createdAt).slice(0, 10) : "-"}</td>
                    <td style={td}>
                      {r.salesName ?? "-"}
                      {r.salesPhone ? <span style={{ opacity: 0.75 }}> ({r.salesPhone})</span> : null}
                    </td>
                    <td style={{ ...td, fontWeight: 900 }}>{r.name ?? "-"}</td>
                    <td style={td}>{r.bizNo ?? "-"}</td>
                    <td style={td}>{r.instNo ?? "-"}</td>
                    <td style={td}>{r.address ?? "-"}</td>
                    <td style={td}>{r.phone ?? "-"}</td>
                    <td style={td}>{r.mobile ?? "-"}</td>
                    <td style={td}>{r.note ?? "-"}</td>
                    <td style={td}>
                      {r.bizFileUrl ? (
                        <button
                          style={linkBtn}
                          onClick={() => window.open(r.bizFileUrl!, "_blank", "noopener,noreferrer")}
                          title={r.bizFileName ?? "사업자등록증 보기"}
                        >
                          보기
                        </button>
                      ) : (
                        <span style={{ opacity: 0.7 }}>없음</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, opacity: 0.75 }}>
          * 모바일에서는 표가 “가로 스크롤”로 보이는 게 정상입니다(글자 세로 찢어짐 방지).
        </div>
      </div>
    </div>
  );
}