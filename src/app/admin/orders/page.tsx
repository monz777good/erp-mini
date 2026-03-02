"use client";

import AdminTopNav from "@/components/AdminTopNav";
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

  user?: { name: string; phone: string } | null;
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

  const tabLabel = tab === "REQUESTED" ? "대기" : tab === "APPROVED" ? "승인" : tab === "REJECTED" ? "거절" : "출고완료";
  const countText = `현재 탭: ${tabLabel} / 건수: ${orders.length}건`;

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <AdminTopNav />

      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5">
        {/* 타이틀 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="m-0 text-xl sm:text-2xl font-black text-black">관리자 주문 목록</h1>
              <div className="mt-2 text-sm font-bold text-gray-700">{countText}</div>
            </div>

            {tab === "APPROVED" ? (
              <a
                href={`/api/admin/rozen-excel?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
              >
                <button className="h-10 rounded-xl bg-black px-4 text-sm font-black text-white">
                  로젠 출력
                </button>
              </a>
            ) : null}
          </div>

          {/* 탭 */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <button className={pill(tab === "REQUESTED")} onClick={() => setTab("REQUESTED")}>
              대기
            </button>
            <button className={pill(tab === "APPROVED")} onClick={() => setTab("APPROVED")}>
              승인
            </button>
            <button className={pill(tab === "REJECTED")} onClick={() => setTab("REJECTED")}>
              거절
            </button>
            <button className={pill(tab === "DONE")} onClick={() => setTab("DONE")}>
              출고완료
            </button>
          </div>

          {/* 필터 */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-black text-black">기간</div>
              <input className={inputCls} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <div className="text-sm font-black text-black">~</div>
              <input className={inputCls} type="date" value={to} onChange={(e) => setTo(e.target.value)} />

              <div className="text-sm font-black text-black sm:ml-2">검색</div>
              <input
                className={`${inputCls} w-full sm:w-[420px]`}
                placeholder="품목명/수하인/거래처/요양기관번호/영업사원/전화 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />

              <button className="h-10 rounded-xl border border-gray-300 bg-white px-4 text-sm font-black text-black" onClick={load}>
                {loading ? "조회중..." : "조회"}
              </button>
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <Th>품목</Th>
                <ThCenter>수량</ThCenter>

                <Th>영업사원</Th>
                <Th>전화번호</Th>

                <Th>수하인</Th>
                <Th>주소</Th>
                <Th>전화</Th>
                <Th>핸드폰</Th>

                <Th>거래처</Th>
                <Th>요양기관번호</Th>

                <Th>비고</Th>
                <ThCenter>작업</ThCenter>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-200">
                  <Td>{o.item?.name || "-"}</Td>
                  <TdCenter>{o.quantity}</TdCenter>

                  <Td>{o.user?.name || "-"}</Td>
                  <Td>{o.user?.phone || "-"}</Td>

                  <Td>{o.receiverName}</Td>
                  <Td>{o.receiverAddr}</Td>
                  <Td>{o.phone || ""}</Td>
                  <Td>{o.mobile || ""}</Td>

                  <Td>{o.client?.name || ""}</Td>
                  <Td>{o.client?.bizRegNo || ""}</Td>

                  <Td>{o.note || ""}</Td>

                  <TdCenter>
                    {tab === "REQUESTED" ? (
                      <div className="flex items-center justify-center gap-2">
                        <button className="h-9 rounded-xl bg-[#1B5E20] px-3 text-sm font-black text-white" onClick={() => updateStatus(o.id, "APPROVED")}>
                          승인
                        </button>
                        <button className="h-9 rounded-xl bg-[#B71C1C] px-3 text-sm font-black text-white" onClick={() => updateStatus(o.id, "REJECTED")}>
                          거절
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-black text-gray-400">-</span>
                    )}
                  </TdCenter>
                </tr>
              ))}

              {!loading && orders.length === 0 && (
                <tr>
                  <td className="p-5 text-sm font-black text-gray-700" colSpan={12}>
                    표시할 주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs font-bold text-gray-700">
          * 로젠 출력 버튼은 승인(승인 탭)에서만 동작하며, 출력 후 해당 건은 출고완료(DONE)로 이동하도록 서버에서 처리됩니다.
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black/10";

function pill(active: boolean) {
  return [
    "h-10 rounded-xl border text-sm font-black",
    active ? "bg-black text-white border-black" : "bg-white text-black border-gray-200",
  ].join(" ");
}

function Th({ children }: { children: any }) {
  return <th className="text-left p-3 text-xs font-black text-black whitespace-nowrap">{children}</th>;
}
function ThCenter({ children }: { children: any }) {
  return <th className="text-center p-3 text-xs font-black text-black whitespace-nowrap">{children}</th>;
}
function Td({ children }: { children: any }) {
  return <td className="p-3 text-sm font-bold text-black align-top">{children}</td>;
}
function TdCenter({ children }: { children: any }) {
  return <td className="p-3 text-sm font-bold text-black text-center whitespace-nowrap align-top">{children}</td>;
}