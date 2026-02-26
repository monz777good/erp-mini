"use client";

import { useEffect, useMemo, useState } from "react";

type OrderRow = {
  id: string;
  status: string;
  quantity: number;
  createdAt: string;

  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;

  note?: string | null;
  message?: string | null;

  item: { id: string; name: string };
  client?: { id: string; name: string; bizRegNo?: string | null } | null;

  user?: { name: string; phone: string } | null; // ✅ 영업사원
};

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminOrdersPage() {
  const today = useMemo(() => fmtDate(new Date()), []);
  const [tab, setTab] = useState<"REQUESTED" | "APPROVED" | "REJECTED" | "DONE">("REQUESTED");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const url =
        `/api/admin/orders?status=${tab}` +
        `&from=${encodeURIComponent(from)}` +
        `&to=${encodeURIComponent(to)}` +
        `&q=${encodeURIComponent(q.trim())}`;

      const res = await fetch(url, { credentials: "include" });

      // ✅ 401/403면 권한 문제 메시지 노출(에러는 안 나게)
      if (!res.ok) {
        setOrders([]);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function updateStatus(id: string, next: "APPROVED" | "REJECTED") {
    const label = next === "APPROVED" ? "승인" : "거절";
    if (!confirm(`상태를 ${label}으로 변경할까요?`)) return;

    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status: next }),
    });

    if (!res.ok) {
      alert("상태 변경 실패");
      return;
    }
    await load();
  }

  const countText = `현재 탭: ${
    tab === "REQUESTED" ? "대기" : tab === "APPROVED" ? "승인" : tab === "REJECTED" ? "거절" : "출고완료"
  } / 건수: ${orders.length}건`;

  return (
    <div style={wrap}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 1000 }}>관리자 주문 목록</h1>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button style={tabBtn(tab === "REQUESTED")} onClick={() => setTab("REQUESTED")}>
          대기
        </button>
        <button style={tabBtn(tab === "APPROVED")} onClick={() => setTab("APPROVED")}>
          승인
        </button>
        <button style={tabBtn(tab === "REJECTED")} onClick={() => setTab("REJECTED")}>
          거절
        </button>
        <button style={tabBtn(tab === "DONE")} onClick={() => setTab("DONE")}>
          출고완료
        </button>
      </div>

      <div style={filterBox}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>기간</div>
          <input style={input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <div style={{ fontWeight: 900 }}>~</div>
          <input style={input} type="date" value={to} onChange={(e) => setTo(e.target.value)} />

          <div style={{ fontWeight: 900, marginLeft: 6 }}>검색</div>
          <input
            style={{ ...input, width: 320, maxWidth: "100%" }}
            placeholder="품목명/수하인/거래처/요양기관번호/영업사원/전화 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button style={btn} onClick={load}>
            조회
          </button>

          {tab === "APPROVED" ? (
            <a
              href={`/api/admin/rozen-excel?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
              style={{ marginLeft: "auto" }}
            >
              <button style={btnDark}>로젠 출력</button>
            </a>
          ) : (
            <div style={{ marginLeft: "auto" }} />
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, fontWeight: 900, opacity: 0.8 }}>{countText}</div>

      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ background: "#F4FBF6" }}>
              <th style={th}>품목</th>
              <th style={th}>수량</th>

              <th style={th}>영업사원</th>
              <th style={th}>전화번호</th>

              <th style={th}>수하인</th>
              <th style={th}>주소</th>
              <th style={th}>전화</th>
              <th style={th}>핸드폰</th>

              <th style={th}>거래처</th>
              <th style={th}>요양기관번호</th>

              <th style={th}>비고</th>
              <th style={thCenter}>작업</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => {
              return (
                <tr key={o.id} style={{ background: "#fff" }}>
                  <td style={td}>{o.item?.name || "-"}</td>
                  <td style={tdCenter}>{o.quantity}</td>

                  <td style={td}>{o.user?.name || "-"}</td>
                  <td style={td}>{o.user?.phone || "-"}</td>

                  <td style={td}>{o.receiverName}</td>
                  <td style={td}>{o.receiverAddr}</td>
                  <td style={td}>{o.phone || ""}</td>
                  <td style={td}>{o.mobile || ""}</td>

                  <td style={td}>{o.client?.name || ""}</td>
                  <td style={td}>{o.client?.bizRegNo || ""}</td>

                  <td style={td}>{o.note || ""}</td>

                  <td style={tdCenter}>
                    {tab === "REQUESTED" ? (
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button style={actionBtn("#1B5E20")} onClick={() => updateStatus(o.id, "APPROVED")}>
                          승인
                        </button>
                        <button style={actionBtn("#B71C1C")} onClick={() => updateStatus(o.id, "REJECTED")}>
                          거절
                        </button>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.6, fontWeight: 900 }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!loading && orders.length === 0 && (
              <tr>
                <td style={{ ...td, padding: 18 }} colSpan={12}>
                  표시할 주문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>
        * 로젠 출력 버튼은 승인(승인 탭)에서만 동작하며, 출력 후 해당 건은 출고완료(DONE)로 이동하도록 서버에서 처리됩니다.
      </p>
    </div>
  );
}

/* =======================
   ✅ 스타일(불투명 카드)
   ======================= */

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "28px auto",
  padding: "22px 22px 18px",
  background: "rgba(255,255,255,0.97)",
  border: "1px solid var(--line)",
  borderRadius: 18,
  boxShadow: "0 16px 50px rgba(0,0,0,0.08)",
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  border: "1px solid var(--line)",
  background: active ? "black" : "white",
  color: active ? "white" : "black",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
  cursor: "pointer",
});

const input: React.CSSProperties = {
  height: 38,
  borderRadius: 10,
  border: "1px solid var(--line)",
  padding: "0 12px",
  outline: "none",
  background: "white",
};

const btn: React.CSSProperties = {
  height: 38,
  borderRadius: 10,
  border: "1px solid var(--line)",
  padding: "0 14px",
  fontWeight: 900,
  cursor: "pointer",
  background: "white",
};

const btnDark: React.CSSProperties = {
  ...btn,
  background: "black",
  color: "white",
  borderColor: "black",
};

const filterBox: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  border: "1px solid var(--line)",
  borderRadius: 14,
  background: "#fff",
};

const tableWrap: React.CSSProperties = {
  marginTop: 10,
  overflowX: "auto",
  borderRadius: 14,
  border: "1px solid var(--line)",
  background: "#fff",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 10px",
  borderBottom: "1px solid var(--line)",
  fontSize: 13,
  fontWeight: 1000,
  whiteSpace: "nowrap",
};

const thCenter: React.CSSProperties = { ...th, textAlign: "center" };

const td: React.CSSProperties = {
  padding: "10px 10px",
  borderBottom: "1px solid var(--line)",
  fontSize: 13,
  verticalAlign: "top",
};

const tdCenter: React.CSSProperties = { ...td, textAlign: "center", whiteSpace: "nowrap" };

function actionBtn(bg: string): React.CSSProperties {
  return {
    border: "none",
    background: bg,
    color: "white",
    borderRadius: 10,
    height: 34,
    padding: "0 12px",
    fontWeight: 1000,
    cursor: "pointer",
  };
}