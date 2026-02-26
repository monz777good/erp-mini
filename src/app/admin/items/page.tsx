"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Item = {
  id: string;
  name: string;
  createdAt: string;
};

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString("ko-KR");
  } catch {
    return s;
  }
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [q, setQ] = useState("");

  // 수정 상태
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/items", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.message ?? "불러오기 실패");
        setItems([]);
        return;
      }
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setErr("네트워크 오류");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return items;
    return items.filter((it) => String(it.name ?? "").toLowerCase().includes(kw));
  }, [items, q]);

  async function addItem() {
    setErr(null);
    const name = newName.trim();
    if (!name) return setErr("품목명을 입력하세요.");

    try {
      const res = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setErr(data?.message ?? "추가 실패");
      setNewName("");
      await load();
    } catch {
      setErr("네트워크 오류");
    }
  }

  function startEdit(it: Item) {
    setErr(null);
    setEditId(it.id);
    setEditName(it.name ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditName("");
  }

  async function saveEdit() {
    setErr(null);
    if (!editId) return;

    const name = editName.trim();
    if (!name) return setErr("품목명은 비울 수 없습니다.");

    try {
      const res = await fetch("/api/admin/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setErr(data?.message ?? "수정 실패");

      cancelEdit();
      await load();
    } catch {
      setErr("네트워크 오류");
    }
  }

  async function deleteItem(id: string, name: string) {
    setErr(null);
    const ok = confirm(`정말 삭제할까요?\n\n품목: ${name}\n\n(주문에 사용된 품목은 삭제가 막힙니다)`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/items?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setErr(data?.message ?? "삭제 실패");
      await load();
    } catch {
      setErr("네트워크 오류");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>품목 등록 (관리자)</h1>
      <div style={{ marginTop: 10, opacity: 0.75, fontWeight: 800 }}>
        품목 추가/삭제/수정은 관리자만 가능합니다.
      </div>

      {err && <div style={{ marginTop: 14, color: "crimson", fontWeight: 900 }}>{err}</div>}

      <div style={{ marginTop: 16, ...card }}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>품목 추가</div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="품목명 (예: 죽염 1.8 2mL)"
            style={{ ...input, flex: 1, minWidth: 260 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem();
            }}
          />
          <button onClick={addItem} style={blackBtn}>
            추가
          </button>
          <button onClick={load} style={btn}>
            새로고침
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="품목 검색 (예: 죽염, 자하거, PDRN...)"
            style={input}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, ...card }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontWeight: 950 }}>목록</div>
          <div style={{ marginLeft: "auto", opacity: 0.75, fontWeight: 800 }}>
            {filtered.length}개 표시 / 전체 {items.length}개
          </div>
        </div>

        <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 220px", background: "#fafafa" }}>
            <Cell head>품목</Cell>
            <Cell head>등록일</Cell>
            <Cell head style={{ textAlign: "right" }}>
              관리
            </Cell>
          </div>

          {loading ? (
            <div style={{ padding: 16, opacity: 0.7 }}>불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 16, opacity: 0.7 }}>목록이 없습니다.</div>
          ) : (
            filtered.map((it) => {
              const isEditing = editId === it.id;
              return (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 220px 220px",
                    borderTop: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <Cell>
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ ...inputSmall, width: "100%" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : (
                      <div style={{ fontWeight: 950 }}>{it.name}</div>
                    )}
                  </Cell>

                  <Cell>{fmtDate(it.createdAt)}</Cell>

                  <Cell>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} style={blackBtnSmall}>
                            저장
                          </button>
                          <button onClick={cancelEdit} style={btnSmall}>
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(it)} style={btnSmall}>
                            수정
                          </button>
                          <button onClick={() => deleteItem(it.id, it.name)} style={redBtnSmall}>
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </Cell>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 10, opacity: 0.75, fontWeight: 800 }}>
          ✅ 주문에 사용된 품목은 삭제가 막힙니다(기록 보호). 그런 경우 <b>수정</b>으로 이름만 바꿔서 정리하세요.
        </div>
      </div>
    </div>
  );
}

function Cell({
  children,
  head,
  style,
}: {
  children: any;
  head?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        padding: "12px 12px",
        fontWeight: head ? 950 : 800,
        fontSize: 13,
        color: head ? "#111" : "#222",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...style,
      }}
      title={typeof children === "string" ? children : undefined}
    >
      {children}
    </div>
  );
}

const card: CSSProperties = {
  padding: 16,
  border: "1px solid #e5e5e5",
  borderRadius: 14,
  background: "white",
};

const input: CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: "0 14px",
  fontWeight: 900,
};

const inputSmall: CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #ddd",
  padding: "0 10px",
  fontWeight: 900,
};

const btn: CSSProperties = {
  height: 44,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: "0 14px",
  fontWeight: 900,
  background: "white",
};

const btnSmall: CSSProperties = {
  height: 34,
  borderRadius: 12,
  border: "1px solid #ddd",
  padding: "0 12px",
  fontWeight: 900,
  background: "white",
};

const blackBtn: CSSProperties = {
  height: 44,
  borderRadius: 12,
  border: "1px solid #111",
  padding: "0 14px",
  fontWeight: 950,
  background: "#111",
  color: "white",
};

const blackBtnSmall: CSSProperties = {
  height: 34,
  borderRadius: 12,
  border: "1px solid #111",
  padding: "0 12px",
  fontWeight: 950,
  background: "#111",
  color: "white",
};

const redBtnSmall: CSSProperties = {
  height: 34,
  borderRadius: 12,
  border: "1px solid crimson",
  padding: "0 12px",
  fontWeight: 950,
  background: "white",
  color: "crimson",
};
