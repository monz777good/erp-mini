"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  name?: string;
  bizRegNo?: string | null;
  careInstitutionNo?: string | null;
  address?: string | null;
  phone?: string | null;
  mobile?: string | null;
  ownerName?: string | null;
  note?: string | null;
  createdAt?: string;
};

export default function AdminEcountClientsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function load(keyword?: string) {
    setMsg("");

    const params = new URLSearchParams();
    const search = (keyword ?? q).trim();

    if (search) params.set("q", search);

    const res = await fetch(`/api/admin/ecount-clients?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      setMsg(`조회 실패 (${res.status})`);
      setRows([]);
      return;
    }

    const data = await res.json().catch(() => null);
    const list = Array.isArray(data?.rows) ? data.rows : [];
    setRows(list);
  }

  useEffect(() => {
    load("");
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

  return (
    <div className="erp-shell">
      <div className="erp-card">
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>
          이카운트 거래처
        </h1>

        <div style={{ fontWeight: 700, opacity: 0.8, marginBottom: 14 }}>
          관리자 전용 이카운트 거래처 목록 (기존 영업사원 거래처와 완전 분리)
        </div>

        {msg ? (
          <div style={{ color: "#ff6b6b", fontWeight: 900, marginBottom: 10 }}>
            {msg}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="거래처명 검색"
              style={inputStyle}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
          </div>

          <button onClick={() => load()} style={btnStyle}>
            검색
          </button>

          <button
            onClick={() => {
              setQ("");
              load("");
            }}
            style={btnStyle}
          >
            전체보기
          </button>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                {[
                  "등록일",
                  "거래처명",
                  "사업자번호",
                  "요양기관번호",
                  "주소",
                  "전화",
                  "핸드폰",
                  "대표자",
                  "비고",
                ].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 18, textAlign: "center", fontWeight: 900, opacity: 0.8 }}>
                    데이터 없음
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.createdAt ? String(r.createdAt).slice(0, 10) : "-"}</td>
                    <td style={td}>{r.name ?? "-"}</td>
                    <td style={td}>{r.bizRegNo ?? "-"}</td>
                    <td style={td}>{r.careInstitutionNo ?? "-"}</td>
                    <td style={td}>{r.address ?? "-"}</td>
                    <td style={td}>{r.phone ?? "-"}</td>
                    <td style={td}>{r.mobile ?? "-"}</td>
                    <td style={td}>{r.ownerName ?? "-"}</td>
                    <td style={td}>{r.note ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}