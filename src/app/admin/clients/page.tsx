"use client";

import { useEffect, useState } from "react";

type ClientRow = {
  id: string;
  createdAt?: string;
  salesName?: string;
  name?: string;
  bizNo?: string;
  instNo?: string;
  email?: string;
  address?: string;
  phone?: string;
  note?: string;
};

export default function AdminClientsPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function load(keyword?: string) {
    setMsg("");
    const qs = keyword ? `?q=${encodeURIComponent(keyword)}` : "";
    const res = await fetch(`/api/admin/clients${qs}`, {
      method: "GET",
      credentials: "include", // ✅ 쿠키 무조건 포함
      cache: "no-store",
    });

    if (!res.ok) {
      setMsg(`조회 실패 (${res.status}) - 관리자 로그인 상태를 확인하세요.`);
      setRows([]);
      return;
    }

    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load("");
  }, []);

  return (
    <div className="erp-shell">
      <div className="erp-card">
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>거래처 / 사업자등록증</h1>
        <div style={{ fontWeight: 700, opacity: 0.75, marginBottom: 14 }}>
          거래처 정보 및 사업자등록증 업로드 현황을 관리합니다.
        </div>

        {msg ? <div style={{ color: "crimson", fontWeight: 900, marginBottom: 10 }}>{msg}</div> : null}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색(거래처/요양기관/이메일/비고/영업사원/전화)"
          style={{
            width: "100%",
            padding: "14px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            fontSize: 16,
            fontWeight: 800,
            marginBottom: 10,
          }}
        />

        <button
          onClick={() => load(q.trim())}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#334155",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          새로고침
        </button>

        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.04)" }}>
                {["등록일", "영업사원", "거래처명", "사업자번호", "요양기관번호", "이메일", "주소", "전화", "비고"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 12, fontWeight: 900, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 18, textAlign: "center", fontWeight: 800, opacity: 0.7 }}>
                    데이터 없음
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.createdAt ? String(r.createdAt).slice(0, 10) : "-"}</td>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.salesName ?? "-"}</td>
                    <td style={{ padding: 12, fontWeight: 900 }}>{r.name ?? "-"}</td>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.bizNo ?? "-"}</td>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.instNo ?? "-"}</td>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.email ?? "-"}</td>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.address ?? "-"}</td>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.phone ?? "-"}</td>
                    <td style={{ padding: 12, fontWeight: 800 }}>{r.note ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, opacity: 0.7 }}>
          * 모바일에서는 표가 “가로 스크롤”로 보이는 게 정상입니다(글자 세로 찢어짐 방지).
        </div>
      </div>
    </div>
  );
}