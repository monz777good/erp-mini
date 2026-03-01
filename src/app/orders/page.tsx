"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

type Item = { id: string; name: string };
type Client = { id: string; name: string };

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function OrdersPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tab = searchParams?.tab || "order";

  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 주문 입력 상태
  const [clientQ, setClientQ] = useState("");
  const [itemQ, setItemQ] = useState("");
  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");

  const input =
    "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/20";
  const select =
    "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/20";

  // ✅ 데이터 로딩: items + clients (401이면 AppShell이 /api/me에서 튕겨줌)
  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        const [itRes, clRes] = await Promise.all([
          fetch("/api/items", { credentials: "include" }),
          fetch("/api/sales/clients", { credentials: "include" }),
        ]);

        // items
        if (itRes.ok) {
          const itJson = await itRes.json().catch(() => []);
          setItems(Array.isArray(itJson) ? itJson : itJson?.items ?? []);
        } else {
          setItems([]);
        }

        // clients
        if (clRes.ok) {
          const clJson = await clRes.json().catch(() => []);
          setClients(Array.isArray(clJson) ? clJson : clJson?.clients ?? []);
        } else {
          // 여기서 빨간 “Unauthorized” 같은 원문구 띄우지 말고, 사용자용 문구
          setClients([]);
          setErr("거래처 불러오기 실패");
        }
      } catch {
        setErr("서버 오류");
      }
    })();
  }, []);

  const filteredClients = useMemo(() => {
    const q = clientQ.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientQ]);

  const filteredItems = useMemo(() => {
    const q = itemQ.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, itemQ]);

  async function submitOrder() {
    setErr(null);
    if (!itemId) return setErr("품목을 선택해주세요.");
    if (!receiverName.trim()) return setErr("수하인명을 입력해주세요.");
    if (!address.trim()) return setErr("주소를 입력해주세요.");

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemId,
          quantity: qty,
          clientId: clientId || null,
          receiverName,
          receiverAddr: address,
          receiverPhone: onlyDigits(receiverPhone),
          note: memo || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || "주문 요청 실패");
        return;
      }

      // 성공 시 초기화(원하면 유지로 바꿔도 됨)
      setMemo("");
      setQty(1);
    } catch {
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      {err ? (
        <div className="mt-2 mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-semibold">
          {err}
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="mt-2">
          <div className="text-2xl font-extrabold mb-2">조회</div>
          <div className="text-sm text-black/55 mb-6">
            조회 UI는 다음 단계에서 “내 거래처/내 주문만” 기준으로 고급스럽게 붙이면 됨.
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
            <div className="text-sm text-black/60">
              (임시) 현재는 UI 복구/라우팅/배경/카드가 우선이라 조회 화면은 안정화만 해둠.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <div className="text-2xl font-extrabold mb-2">주문요청</div>
          <div className="text-sm text-black/55 mb-6">
            거래처/품목을 선택하고 배송정보 입력 후 주문요청
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="text-sm font-bold mb-2">거래처 검색</div>
              <input className={input} value={clientQ} onChange={(e) => setClientQ(e.target.value)} placeholder="거래처 검색 (이름/대표자)" />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm font-bold mb-2">거래처(선택)</div>
              <select className={select} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">(선택안함)</option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm font-bold mb-2">품목 검색</div>
              <input className={input} value={itemQ} onChange={(e) => setItemQ(e.target.value)} placeholder="품목 검색" />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm font-bold mb-2">품목</div>
              <select className={select} value={itemId} onChange={(e) => setItemId(e.target.value)}>
                <option value="">(선택)</option>
                {filteredItems.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm font-bold mb-2">수량</div>
              <input className={input} type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} />
            </div>
            <div>
              <div className="text-sm font-bold mb-2">수하인명</div>
              <input className={input} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="예: 홍길동" />
            </div>

            <div>
              <div className="text-sm font-bold mb-2">전화번호</div>
              <input className={input} value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="숫자만" />
            </div>
            <div>
              <div className="text-sm font-bold mb-2">주소 전체</div>
              <input className={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="예: 경기도 시흥시 ..." />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm font-bold mb-2">배송메세지(선택)</div>
              <input className={input} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 취급주의" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              disabled={loading}
              onClick={submitOrder}
              className="px-6 py-3 rounded-2xl bg-black text-white font-extrabold shadow-md disabled:opacity-50"
            >
              {loading ? "요청 중..." : "주문 요청"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}