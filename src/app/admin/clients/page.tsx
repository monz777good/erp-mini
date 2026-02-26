"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  createdAt: string;
  name: string;
  bizNo?: string | null;
  addr?: string | null;
  tel?: string | null;
  careNo?: string | null;
  email?: string | null;
  remark?: string | null;
  bizCertPath?: string | null;
  ownerUser?: { name?: string | null; phone?: string | null } | null;
};

export default function AdminClientsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients", { credentials: "include", cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(`조회 실패 (${res.status})\n${json?.message ?? ""}`);
        return;
      }
      setRows(Array.isArray(json.clients) ? json.clients : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      `${r.name ?? ""} ${r.bizNo ?? ""} ${r.tel ?? ""} ${r.addr ?? ""} ${r.careNo ?? ""} ${
        r.email ?? ""
      } ${r.remark ?? ""} ${r.ownerUser?.name ?? ""} ${r.ownerUser?.phone ?? ""}`
        .toLowerCase()
        .includes(kw)
    );
  }, [rows, q]);

  const wrap: React.CSSProperties = { maxWidth: 1180, margin: "22px auto", padding: "0 16px" };
  const top: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center", marginBottom: 14 };
  const title: React.CSSProperties = { fontSize: 26, fontWeight: 950 };
  const input: React.CSSProperties = {
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    outline: "none",
    width: 360,
    maxWidth: "100%",
  };
  const btn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #111",
    background: "#111",
    color: "white",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const btnDis: React.CSSProperties = { ...btn, opacity: 0.5, cursor: "not-allowed" };

  const tableWrap: React.CSSProperties = {
    marginTop: 12,
    border: "1px solid #eee",
    borderRadius: 16,
    overflow: "hidden",
    background: "white",
    boxShadow: "0 8px 26px rgba(0,0,0,0.04)",
  };
  const thead: React.CSSProperties = { display: "flex", background: "#fafafa", borderBottom: "1px solid #eee" };
  const trow: React.CSSProperties = { display: "flex", borderBottom: "1px solid #f0f0f0" };
  const th: React.CSSProperties = { padding: "12px 12px", fontWeight: 950, fontSize: 13, color: "#111" };
  const td: React.CSSProperties = { padding: "12px 12px", fontWeight: 800, fontSize: 13, color: "#111" };

  const Th = (p: { style?: React.CSSProperties; children: any }) => <div style={{ ...th, ...p.style }}>{p.children}</div>;
  const Td = (p: { style?: React.CSSProperties; children: any }) => <div style={{ ...td, ...p.style }}>{p.children}</div>;

  return (
    <div style={wrap}>
      <div style={top}>
        <div style={title}>거래처 / 사업자등록증</div>
        <div style={{ flex: 1 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색(거래처/요양기관/이메일/비고/영업사원)" style={input} />
        <button style={loading ? btnDis : btn} disabled={loading} onClick={load}>
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      <div style={tableWrap}>
        <div style={thead}>
          <Th style={{ width: 110 }}>등록일</Th>
          <Th style={{ width: 160 }}>영업사원</Th>
          <Th style={{ width: 200 }}>거래처명</Th>
          <Th style={{ width: 140 }}>사업자번호</Th>
          <Th style={{ width: 140 }}>요양기관번호</Th>
          <Th style={{ width: 200 }}>이메일</Th>
          <Th>주소</Th>
          <Th style={{ width: 140 }}>전화</Th>
          <Th style={{ width: 220 }}>비고</Th>
          <Th style={{ width: 120, textAlign: "center" }}>등록증</Th>
        </div>

        {list.length === 0 ? (
          <div style={{ padding: 14, opacity: 0.7, fontWeight: 900 }}>데이터 없음</div>
        ) : (
          list.map((r) => (
            <div key={r.id} style={trow}>
              <Td style={{ width: 110 }}>{String(r.createdAt ?? "").slice(0, 10)}</Td>

              <Td style={{ width: 160 }}>
                <div style={{ fontWeight: 950 }}>{r.ownerUser?.name ?? "-"}</div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>{r.ownerUser?.phone ?? ""}</div>
              </Td>

              <Td style={{ width: 200, fontWeight: 950 }}>{r.name}</Td>
              <Td style={{ width: 140 }}>{r.bizNo ?? "-"}</Td>
              <Td style={{ width: 140 }}>{r.careNo ?? "-"}</Td>
              <Td style={{ width: 200 }}>{r.email ?? "-"}</Td>
              <Td>{r.addr ?? "-"}</Td>
              <Td style={{ width: 140 }}>{r.tel ?? "-"}</Td>
              <Td style={{ width: 220 }}>{r.remark ?? "-"}</Td>

              <Td style={{ width: 120, textAlign: "center" }}>
                {r.bizCertPath ? (
                  <a href={r.bizCertPath} target="_blank" rel="noreferrer" style={{ fontWeight: 950 }}>
                    보기
                  </a>
                ) : (
                  <span style={{ opacity: 0.6 }}>없음</span>
                )}
              </Td>
            </div>
          ))
        )}
      </div>
    </div>
  );
}