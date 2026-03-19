// src/app/admin/items/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  price: number;
  createdAt?: string;
};

function priceText(v: number) {
  return `${Number(v || 0).toLocaleString()}원`;
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("0");

  async function load() {
    setMsg("");
    const res = await fetch("/api/admin/items", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      setMsg(data?.message || `불러오기 실패 (${res.status})`);
      setItems([]);
      return;
    }

    setItems(Array.isArray(data.items) ? data.items : []);
  }

  async function add() {
    setMsg("");
    const n = name.trim();
    const p = Math.max(0, Number(price || 0));

    if (!n) {
      setMsg("품목명을 입력하세요.");
      return;
    }

    const res = await fetch("/api/admin/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n, price: p }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      setMsg(data?.message || `추가 실패 (${res.status})`);
      return;
    }

    setName("");
    setPrice("0");
    await load();
  }

  function startEdit(it: Item) {
    setEditId(it.id);
    setEditName(it.name);
    setEditPrice(String(it.price ?? 0));
    setMsg("");
  }

  function cancelEdit() {
    setEditId(null);
    setEditName("");
    setEditPrice("0");
  }

  async function saveEdit() {
    if (!editId) return;

    const n = editName.trim();
    const p = Math.max(0, Number(editPrice || 0));

    if (!n) {
      setMsg("품목명을 입력하세요.");
      return;
    }

    setMsg("");
    const res = await fetch("/api/admin/items", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, name: n, price: p }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      setMsg(data?.message || `수정 실패 (${res.status})`);
      return;
    }

    cancelEdit();
    await load();
  }

  async function del(id: string) {
    if (!confirm("삭제할까요? (주문에 사용된 품목은 삭제 불가)")) return;
    setMsg("");

    const res = await fetch(`/api/admin/items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      setMsg(data?.message || `삭제 실패 (${res.status})`);
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
    return items.filter((x) => (x.name || "").includes(s));
  }, [items, q]);

  return (
    <div className="erp-shell">
      <div className="erp-card">
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>품목 등록 (관리자)</h1>
        <div style={{ fontWeight: 700, opacity: 0.75, marginBottom: 14 }}>
          품목 추가/삭제/수정은 관리자만 가능합니다. (주문에 사용된 품목은 삭제가 막혀서 <b>수정</b>으로 처리하세요.)
        </div>

        {msg ? <div style={{ color: "crimson", fontWeight: 900, marginBottom: 10 }}>{msg}</div> : null}

        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>품목 추가</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10, marginBottom: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="품목명 (예: 죽염 1.8 2mL)"
              style={{
                width: "100%",
                padding: "14px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: 16,
                fontWeight: 800,
              }}
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="가격"
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
              filtered.map((it) => {
                const editing = editId === it.id;
                return (
                  <div
                    key={it.id}
                    style={{
                      padding: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,1fr) 180px", gap: 10, flex: 1, minWidth: 320 }}>
                      {editing ? (
                        <>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.12)",
                              fontWeight: 900,
                            }}
                          />
                          <input
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value.replace(/[^\d]/g, ""))}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.12)",
                              fontWeight: 900,
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 900 }}>{it.name}</div>
                          <div style={{ fontWeight: 900, opacity: 0.8 }}>{priceText(it.price)}</div>
                        </>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {editing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.12)",
                              background: "rgba(34, 197, 94, 0.15)",
                              color: "#166534",
                              fontWeight: 900,
                              cursor: "pointer",
                            }}
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.12)",
                              background: "rgba(148, 163, 184, 0.2)",
                              color: "#0f172a",
                              fontWeight: 900,
                              cursor: "pointer",
                            }}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(it)}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.12)",
                              background: "rgba(59, 130, 246, 0.12)",
                              color: "#1d4ed8",
                              fontWeight: 900,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            수정
                          </button>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}