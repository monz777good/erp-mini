// src/app/admin/orders/OrdersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type RowItem = {
  itemId: string;
  itemName: string;
  quantity: number;
};

type AdminOrderRow = {
  id: string; // groupKey
  createdAt: string;
  status: string;

  userName: string;
  userPhone: string;

  clientName: string;
  clientId: string;

  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;
  note?: string | null;

  items: RowItem[]; // ✅ 여기로 품목 목록이 내려온다고 가정
  orderIds: string[];
};

function ymdKST(d: Date) {
  // YYYY-MM-DD (KST)
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yy = k.getUTCFullYear();
  const mm = String(k.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(k.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function fmtKST(iso: string) {
  const d = new Date(iso);
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yy = k.getUTCFullYear();
  const mm = String(k.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(k.getUTCDate()).padStart(2, "0");
  const hh = String(k.getUTCHours()).padStart(2, "0");
  const mi = String(k.getUTCMinutes()).padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function OrdersClient() {
  const [tab, setTab] = useState<"REQUESTED" | "APPROVED" | "REJECTED" | "DONE">(
    "REQUESTED"
  );

  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState<string>(() => ymdKST(new Date(Date.now() - 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState<string>(() => ymdKST(today));
  const [q, setQ] = useState<string>("");

  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      params.set("status", tab);
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setRows([]);
        setError(data?.message || "LOAD_FAILED");
        return;
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e: any) {
      setRows([]);
      setError("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function renderItems(items: RowItem[]) {
    if (!items || items.length === 0) return <span className="text-white/70">-</span>;

    // ✅ 품목명 + x수량 을 줄바꿈으로 표시
    return (
      <div className="flex flex-col gap-1">
        {items.map((it, idx) => (
          <div key={`${it.itemId}-${idx}`} className="leading-snug">
            <span className="font-medium">{it.itemName}</span>{" "}
            <span className="text-white/80">x{it.quantity}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 상단: 탭 */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "REQUESTED" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("REQUESTED")}
        >
          대기
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "APPROVED" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("APPROVED")}
        >
          승인
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "REJECTED" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("REJECTED")}
        >
          거절
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "DONE" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("DONE")}
        >
          출고완료
        </button>
      </div>

      {/* 기간/검색 */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10"
        />
        <span className="text-white/70">~</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색 (품목/수하인/거래처/요양기관/번호)"
          className="flex-1 min-w-[240px] px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10"
        />
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-white/15 text-white border border-white/10 hover:bg-white/20"
        >
          조회
        </button>
      </div>

      {error ? (
        <div className="px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-100">
          {error}
        </div>
      ) : null}

      {/* 테이블 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-white/5 text-white/80">
            <tr>
              <th className="text-left px-4 py-3">등록일</th>
              <th className="text-left px-4 py-3">거래처</th>
              <th className="text-left px-4 py-3">수하인</th>
              <th className="text-left px-4 py-3">주소</th>
              <th className="text-left px-4 py-3">전화</th>
              <th className="text-left px-4 py-3">핸드폰</th>

              {/* ✅ 여기! “품목” 칼럼에 품목 목록이 줄바꿈으로 보이게 */}
              <th className="text-left px-4 py-3">품목</th>
            </tr>
          </thead>

          <tbody className="text-white/90">
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={7}>
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={7}>
                  데이터 없음
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-4 py-3 whitespace-nowrap">{fmtKST(r.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.clientName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.receiverName}</td>
                  <td className="px-4 py-3 min-w-[320px]">{r.receiverAddr}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.phone ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.mobile ?? "-"}</td>

                  {/* ✅ 품목 목록 표시 */}
                  <td className="px-4 py-3 min-w-[260px]">{renderItems(r.items)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}