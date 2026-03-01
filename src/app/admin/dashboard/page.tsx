"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "DONE" | "SHIPPED";
type OrderRow = {
  id: string;
  status: OrderStatus;
  createdAt?: string;
  quantity?: number;

  item?: { name?: string } | null;
  user?: { name?: string; phone?: string } | null;

  receiverName?: string;
  receiverAddr?: string;
  receiverPhone?: string;
  receiverMobile?: string;

  note?: string | null;
  clientName?: string | null; // 혹시 거래처명이 있다면
};

function fmtDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeOrders(data: any): OrderRow[] {
  if (Array.isArray(data)) return data as OrderRow[];
  if (Array.isArray(data?.orders)) return data.orders as OrderRow[];
  if (Array.isArray(data?.data)) return data.data as OrderRow[];
  return [];
}

async function fetchOrdersSmart(params: { from: string; to: string; q: string }) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.q) qs.set("q", params.q);

  // ✅ 1순위: 관리자 전용
  const try1 = `/api/admin/orders?${qs.toString()}`;
  const r1 = await fetch(try1, { credentials: "include", cache: "no-store" });
  if (r1.ok) return normalizeOrders(await r1.json());

  // ✅ 2순위: 기존에 /api/orders로 관리자도 보던 프로젝트 대비
  const try2 = `/api/orders?${qs.toString()}`;
  const r2 = await fetch(try2, { credentials: "include", cache: "no-store" });
  if (r2.ok) return normalizeOrders(await r2.json());

  // 둘 다 실패면 빈 배열(화면은 유지)
  return [];
}

export default function AdminDashboardPage() {
  const today = useMemo(() => fmtDate(new Date()), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");

  const [tab, setTab] = useState<"ALL" | OrderStatus>("ALL");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string>("");

  const filtered = useMemo(() => {
    const base = tab === "ALL" ? orders : orders.filter((o) => o.status === tab);
    return base;
  }, [orders, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length, REQUESTED: 0, APPROVED: 0, REJECTED: 0, DONE: 0, SHIPPED: 0 };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const list = await fetchOrdersSmart({ from, to, q });
      setOrders(list);
    } catch {
      setErr("주문 목록을 불러오지 못했습니다.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabBtn = (active: boolean) => ({
    height: 36,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,.10)",
    background: active ? "#111827" : "rgba(255,255,255,.75)",
    color: active ? "#fff" : "#111",
    fontWeight: 950 as const,
    cursor: "pointer",
  });

  const smallCard = {
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.10)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 22px rgba(0,0,0,.08)",
    minWidth: 160,
  } as const;

  return (
    <div>
      <div className="erp-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 className="erp-title">관리자 대시보드</h1>
          <p className="erp-subtitle">주문 관리 / 승인·거절 / 로젠 출력 / 품목·거래처·재고 관리</p>
        </div>

        <button className="erp-btn" style={{ width: 120, height: 40, fontSize: 14 }} onClick={load} disabled={loading}>
          {loading ? "불러오는중" : "새로고침"}
        </button>
      </div>

      {/* ✅ 통계 카드 */}
      <div className="erp-row" style={{ gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        <div style={smallCard}>
          <div style={{ fontWeight: 900, color: "#334155" }}>전체</div>
          <div style={{ fontSize: 34, fontWeight: 950 }}>{counts.ALL}</div>
        </div>
        <div style={smallCard}>
          <div style={{ fontWeight: 900, color: "#334155" }}>대기</div>
          <div style={{ fontSize: 34, fontWeight: 950 }}>{counts.REQUESTED}</div>
        </div>
        <div style={smallCard}>
          <div style={{ fontWeight: 900, color: "#334155" }}>승인</div>
          <div style={{ fontSize: 34, fontWeight: 950 }}>{counts.APPROVED}</div>
        </div>
        <div style={smallCard}>
          <div style={{ fontWeight: 900, color: "#334155" }}>거절</div>
          <div style={{ fontSize: 34, fontWeight: 950 }}>{counts.REJECTED}</div>
        </div>
        <div style={smallCard}>
          <div style={{ fontWeight: 900, color: "#334155" }}>출고완료</div>
          <div style={{ fontSize: 34, fontWeight: 950 }}>{counts.DONE}</div>
        </div>
      </div>

      {/* ✅ 탭 + 검색/기간 */}
      <div style={{ marginTop: 18, padding: 14, borderRadius: 16, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.85)" }}>
        <div className="erp-row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button style={tabBtn(tab === "ALL")} onClick={() => setTab("ALL")}>전체</button>
          <button style={tabBtn(tab === "REQUESTED")} onClick={() => setTab("REQUESTED")}>대기</button>
          <button style={tabBtn(tab === "APPROVED")} onClick={() => setTab("APPROVED")}>승인</button>
          <button style={tabBtn(tab === "REJECTED")} onClick={() => setTab("REJECTED")}>거절</button>
          <button style={tabBtn(tab === "DONE")} onClick={() => setTab("DONE")}>출고완료</button>
        </div>

        <div className="erp-row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <div className="erp-row" style={{ gap: 8 }}>
            <div style={{ fontWeight: 950, color: "#111827" }}>기간</div>
            <input className="erp-input" style={{ width: 160 }} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <div style={{ fontWeight: 950 }}>~</div>
            <input className="erp-input" style={{ width: 160 }} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="erp-row" style={{ gap: 8, flex: 1, minWidth: 260 }}>
            <div style={{ fontWeight: 950, color: "#111827" }}>검색</div>
            <input
              className="erp-input"
              placeholder="품목/수하인/거래처/전화/영업사원 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <button className="erp-btn" style={{ width: 110, height: 44, fontSize: 14 }} onClick={load} disabled={loading}>
            조회
          </button>
        </div>

        {err ? <div style={{ marginTop: 10, fontWeight: 950, color: "#b91c1c" }}>{err}</div> : null}
      </div>

      {/* ✅ 주문 목록 테이블 */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 950, marginBottom: 8 }}>
          현재 탭: {tab === "ALL" ? "전체" : tab} / 건수: {filtered.length}건
        </div>

        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>등록일</th>
                <th>품목</th>
                <th>수량</th>
                <th>영업사원</th>
                <th>전화</th>
                <th>수하인</th>
                <th>주소</th>
                <th>전화</th>
                <th>핸드폰</th>
                <th>비고</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 18, color: "#64748b", fontWeight: 900 }}>
                    표시할 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id}>
                    <td>{o.createdAt ? String(o.createdAt).slice(0, 10) : "-"}</td>
                    <td>{o.item?.name ?? "-"}</td>
                    <td>{o.quantity ?? "-"}</td>
                    <td>{o.user?.name ?? "-"}</td>
                    <td>{o.user?.phone ?? "-"}</td>
                    <td>{o.receiverName ?? "-"}</td>
                    <td style={{ minWidth: 260 }}>{o.receiverAddr ?? "-"}</td>
                    <td>{o.receiverPhone ?? "-"}</td>
                    <td>{o.receiverMobile ?? "-"}</td>
                    <td style={{ minWidth: 180 }}>{o.note ?? ""}</td>
                    <td style={{ fontWeight: 950 }}>{o.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, color: "#475569", fontWeight: 850, fontSize: 13 }}>
          * 만약 주문 데이터가 안 뜨면: 프로젝트의 주문 API 경로가 다를 수 있어서 /api/admin/orders 또는 /api/orders 중 실제 경로에 맞게 자동 시도합니다.
        </div>
      </div>
    </div>
  );
}