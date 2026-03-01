"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; name: string; createdAt?: string };

function normalizeItems(data: any): Item[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => it.name.toLowerCase().includes(s));
  }, [items, q]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/items", {
        method: "GET",
        credentials: "include", // ✅ 핵심
        cache: "no-store",
      });

      if (res.status === 401) {
        setErr("권한 없음 (관리자 로그인 필요)");
        setItems([]);
        return;
      }
      if (!res.ok) {
        setErr(`불러오기 실패 (${res.status})`);
        setItems([]);
        return;
      }

      const data = await res.json();
      setItems(normalizeItems(data));
    } catch {
      setErr("네트워크 오류");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    const v = name.trim();
    if (!v) return;

    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/items", {
        method: "POST",
        credentials: "include", // ✅ 핵심
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: v }),
      });

      if (res.status === 401) {
        setErr("권한 없음 (관리자 로그인 필요)");
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setErr(t || `추가 실패 (${res.status})`);
        return;
      }

      setName("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="erp-title">품목 등록 (관리자)</h1>
      <p className="erp-subtitle">품목 추가/삭제/수정은 관리자만 가능합니다.</p>

      {err ? <div style={{ color: "#b91c1c", fontWeight: 950, marginBottom: 10 }}>{err}</div> : null}

      <div style={{ background: "rgba(255,255,255,.9)", border: "1px solid rgba(15,23,42,.10)", borderRadius: 16, padding: 14 }}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>품목 추가</div>

        <div className="erp-row">
          <input
            className="erp-input"
            placeholder="품목명 (예: 죽염 1.8 2mL)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="erp-btn" style={{ width: 120, height: 44 }} onClick={add} disabled={loading}>
            추가
          </button>
          <button className="erp-btn" style={{ width: 120, height: 44, background: "#334155" }} onClick={load} disabled={loading}>
            새로고침
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <input className="erp-input" placeholder="품목 검색 (예: 죽염, 자하거, PDRN...)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: 14, background: "rgba(255,255,255,.9)", border: "1px solid rgba(15,23,42,.10)", borderRadius: 16, padding: 14 }}>
        <div className="erp-row" style={{ justifyContent: "space-between" }}>
          <div style={{ fontWeight: 950 }}>목록</div>
          <div style={{ fontWeight: 900, color: "#334155" }}>
            {filtered.length}개 표시 / 전체 {items.length}개
          </div>
        </div>

        <div className="erp-table-wrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>품목</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: 18, textAlign: "center", color: "#64748b", fontWeight: 900 }}>
                    목록이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it.id}>
                    <td style={{ fontWeight: 900 }}>{it.name}</td>
                    <td>{it.createdAt ? String(it.createdAt).slice(0, 10) : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, fontSize: 13, color: "#475569", fontWeight: 800 }}>
          * 주문에 사용된 품목은 삭제가 막힐 수 있습니다(기록 보호). 그 경우 이름 수정으로 정리하세요.
        </div>
      </div>
    </div>
  );
}