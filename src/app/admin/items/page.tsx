"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; name: string; createdAt?: string };

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    const res = await fetch("/api/admin/items", {
      method: "GET",
      credentials: "include", // ✅ 쿠키 무조건 포함
      cache: "no-store",
    });

    if (!res.ok) {
      setMsg(`불러오기 실패 (${res.status})`);
      setItems([]);
      return;
    }

    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  async function add() {
    setMsg("");
    const res = await fetch("/api/admin/items", {
      method: "POST",
      credentials: "include", // ✅ 쿠키 무조건 포함
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const t = await res.json().catch(() => null);
      setMsg(t?.message || `추가 실패 (${res.status})`);
      return;
    }
    setName("");
    await load();
  }

  async function del(id: string) {
    if (!confirm("삭제할까요?")) return;
    setMsg("");
    const res = await fetch(`/api/admin/items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include", // ✅ 쿠키 무조건 포함
    });
    if (!res.ok) {
      setMsg(`삭제 실패 (${res.status})`);
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return items;
    return items.filter((x) => x.name?.includes(s));
  }, [items, q]);

  return (
    <div className="erp-shell">
      <div className="erp-card">
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>품목 등록 (관리자)</h1>
        <div style={{ fontWeight: 700, opacity: 0.75, marginBottom: 14 }}>
          품목 추가/삭제/수정은 관리자만 가능합니다.
        </div>

        {msg ? <div style={{ color: "crimson", fontWeight: 900, marginBottom: 10 }}>{msg}</div> : null}

        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>품목 추가</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="품목명 (예: 죽염 1.8 2mL)"
            style={{
              width: "100%",
              padding: "14px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              marginBottom: 10,
              fontSize: 16,
              fontWeight: 800,
            }}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={add}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#111827",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              추가
            </button>
            <button
              onClick={load}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#334155",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              새로고침
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="품목 검색 (예: 죽염, 자하거, PDRN...)"
              style={{
                width: "100%",
                padding: "14px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: 16,
                fontWeight: 800,
              }}
            />
          </div>
        </div>

        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: 14, fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
            <span>목록</span>
            <span>{filtered.length}개 표시 / 전체 {items.length}개</span>
          </div>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 18, textAlign: "center", fontWeight: 800, opacity: 0.7 }}>목록이 없습니다.</div>
            ) : (
              filtered.map((it) => (
                <div
                  key={it.id}
                  style={{
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{it.name}</div>
                  <button
                    onClick={() => del(it.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#b91c1c",
                      fontWeight: 900,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}