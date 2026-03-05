// src/app/admin/orders/OrdersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ItemLine = {
  itemId?: string;
  itemName?: string;
  quantity?: number;
};

type AdminRow = {
  id: string; // 대표 id (승인/거절 시 /api/admin/orders/:id 로 PATCH)
  createdAt: string;
  status: string;

  // 화면 컬럼들 (프로젝트마다 이름이 조금 달라도 최대한 호환)
  userName?: string;
  userPhone?: string;

  receiverName?: string;
  receiverAddr?: string;
  phone?: string | null;
  mobile?: string | null;

  clientName?: string;
  clientId?: string;

  hospitalNo?: string | null; // 요양기관번호 (있으면)
  note?: string | null;

  // ✅ 장바구니 그룹 품목 리스트
  items?: ItemLine[];

  // ✅ 묶음 업데이트용 (있으면 사용)
  orderIds?: string[];

  // ✅ 예전 단일 주문 호환
  itemName?: string;
  quantity?: number;
};

function ymdKST(d: Date) {
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
  return `${yy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function OrdersClient() {
  const [tab, setTab] = useState<"REQUESTED" | "APPROVED" | "REJECTED" | "DONE">(
    "REQUESTED"
  );

  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState<string>(() =>
    ymdKST(new Date(Date.now() - 24 * 60 * 60 * 1000))
  );
  const [to, setTo] = useState<string>(() => ymdKST(today));
  const [q, setQ] = useState<string>("");

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
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
        alert(data?.message || "조회 실패");
        setRows([]);
        return;
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch {
      alert("NETWORK_ERROR");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function renderItemNames(r: AdminRow) {
    const items = Array.isArray(r.items) ? r.items : [];
    if (items.length > 0) {
      return (
        <div className="flex flex-col gap-1">
          {items.map((it, idx) => (
            <div key={`${it.itemId ?? "it"}-${idx}`} className="leading-snug">
              {it.itemName ?? "-"}
            </div>
          ))}
        </div>
      );
    }
    // 예전 단일 호환
    return <div className="leading-snug">{r.itemName ?? "-"}</div>;
  }

  function renderQty(r: AdminRow) {
    const items = Array.isArray(r.items) ? r.items : [];
    if (items.length > 0) {
      return (
        <div className="flex flex-col gap-1">
          {items.map((it, idx) => (
            <div key={`${it.itemId ?? "q"}-${idx}`} className="leading-snug">
              x{Number(it.quantity ?? 1)}
            </div>
          ))}
        </div>
      );
    }
    return <div>x{Number(r.quantity ?? 1)}</div>;
  }

  async function changeStatus(r: AdminRow, status: "APPROVED" | "REJECTED" | "DONE") {
    try {
      const res = await fetch(`/api/admin/orders/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        alert(`상태변경 실패\n${data?.message ?? `HTTP_${res.status}`}`);
        return;
      }

      await load();
    } catch {
      alert("NETWORK_ERROR");
    }
  }

  // ✅ 로젠 출력 (승인 탭에서만 노출)
  async function exportLozen() {
    try {
      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);

      // ✅ 여기 URL이 네 프로젝트 실제 엔드포인트와 다르면 Network에서 확인 후 바꾸면 됨
      const res = await fetch(`/api/admin/lozen/export?${params.toString()}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.message || `로젠 출력 실패 (HTTP_${res.status})`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lozen_${from}_${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // 필요하면 load()로 갱신
      await load();
    } catch {
      alert("NETWORK_ERROR");
    }
  }

  return (
    <div className="space-y-3">
      {/* 탭 */}
      <div className="flex gap-2 flex-wrap">
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

      {/* 기간/검색 + 조회 + (승인탭) 로젠 출력 */}
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
          placeholder="검색 (품목/수하인/거래처/요양기관/영업/전화/비고)"
          className="flex-1 min-w-[260px] px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10"
        />

        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-white/15 text-white border border-white/10 hover:bg-white/20"
        >
          조회
        </button>

        {tab === "APPROVED" ? (
          <button
            onClick={exportLozen}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-50 border border-emerald-500/30 hover:bg-emerald-500/25"
          >
            로젠 출력
          </button>
        ) : null}
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-auto">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-white/5 text-white/80">
            <tr>
              <th className="text-left px-4 py-3">등록일</th>
              <th className="text-left px-4 py-3">품목</th>
              <th className="text-left px-4 py-3">수량</th>
              <th className="text-left px-4 py-3">영업사원</th>
              <th className="text-left px-4 py-3">영업전화</th>
              <th className="text-left px-4 py-3">수하인</th>
              <th className="text-left px-4 py-3">주소</th>
              <th className="text-left px-4 py-3">전화</th>
              <th className="text-left px-4 py-3">핸드폰</th>
              <th className="text-left px-4 py-3">거래처</th>
              <th className="text-left px-4 py-3">요양기관번호</th>
              <th className="text-left px-4 py-3">비고</th>
              <th className="text-left px-4 py-3">작업</th>
            </tr>
          </thead>

          <tbody className="text-white/90">
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={13}>
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={13}>
                  데이터 없음
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">{fmtKST(r.createdAt)}</td>
                  <td className="px-4 py-3 min-w-[260px]">{renderItemNames(r)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{renderQty(r)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.userName ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.userPhone ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.receiverName ?? "-"}</td>
                  <td className="px-4 py-3 min-w-[320px]">{r.receiverAddr ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.phone ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.mobile ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.clientName ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.hospitalNo ?? "-"}</td>
                  <td className="px-4 py-3 min-w-[180px]">{r.note ?? "-"}</td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {tab === "REQUESTED" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => changeStatus(r, "APPROVED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-50 hover:bg-emerald-500/25"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => changeStatus(r, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-50 hover:bg-rose-500/20"
                        >
                          거절
                        </button>
                      </div>
                    ) : tab === "APPROVED" ? (
                      <button
                        onClick={() => changeStatus(r, "DONE")}
                        className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white hover:bg-white/15"
                      >
                        출고완료
                      </button>
                    ) : (
                      <span className="text-white/60">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-white/60">
        * “승인/거절”은 “대기” 탭에서만 버튼이 보입니다.
      </div>
    </div>
  );
}