"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  name: string;
  createdAt?: string;
};

export default function ItemsPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ 관리자 체크: /api/me가 없을 수도 있어서 /api/admin/me → /api/me 순서로 시도
  useEffect(() => {
    (async () => {
      try {
        const candidates = ["/api/admin/me", "/api/me"];
        let me: any = null;

        for (const url of candidates) {
          const res = await fetch(url, { credentials: "include" }).catch(() => null);
          if (res && res.ok) {
            me = await res.json().catch(() => null);
            if (me) break;
          }
        }

        const role = String(me?.role ?? "").toUpperCase();
        if (role !== "ADMIN") {
          // ✅ 영업은 품목 등록 못함 → 주문요청으로 보내버림
          router.replace("/orders");
          return;
        }

        setChecking(false);
      } catch {
        // me를 못 읽으면 로그인 화면으로
        router.replace("/login");
      }
    })();
  }, [router]);

  async function refresh() {
    const res = await fetch("/api/items", { credentials: "include" });
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.items ?? [];
    setItems(list);
  }

  useEffect(() => {
    if (!checking) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  async function addItem() {
    if (!name.trim()) return alert("품목명을 입력하세요.");
    setLoading(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg?.message ?? "추가 실패");
        return;
      }

      setName("");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("삭제할까요?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/items?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg?.message ?? "삭제 실패");
        return;
      }

      await refresh();
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <div style={{ padding: 24 }}>권한 확인 중...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>품목 등록</h1>
          <div style={{ color: "#666", fontWeight: 800 }}>
            재고 기능 없음. 이름만 등록합니다.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/admin/orders")}
            style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white", fontWeight: 900 }}
          >
            홈
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #ddd", background: "white", fontWeight: 900 }}
          >
            새로고침
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="품목명 (예: A4용지)"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 12,
            outline: "none",
          }}
        />
        <button
          onClick={addItem}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            fontWeight: 900,
          }}
        >
          추가
        </button>
      </div>

      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>목록</div>

        {items.length === 0 ? (
          <div style={{ color: "#777" }}>등록된 품목이 없습니다.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{it.name}</div>
                  <div style={{ color: "#777", fontWeight: 700, fontSize: 12 }}>
                    {it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(it.id)}
                  disabled={loading}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#d00",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
