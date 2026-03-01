"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type Item = { id: string; name: string };
type Client = { id: string; name: string };

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function OrdersPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = sp.get("tab") ?? "order";

  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [clientQ, setClientQ] = useState("");
  const [itemQ, setItemQ] = useState("");
  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");

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
          setClients([]);
          setErr("거래처를 불러오지 못했습니다. (권한/세션 확인)");
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

      // 성공 처리
      setMemo("");
      setQty(1);
      setReceiverName("");
      setReceiverPhone("");
      setAddress("");
      alert("주문 요청 완료!");
      router.replace("/orders?tab=order");
    } catch {
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      {err ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-extrabold text-red-700">
          {err}
        </div>
      ) : null}

      {tab === "history" ? (
        <div>
          <div className="text-2xl font-black tracking-tight">조회</div>
          <div className="mt-2 text-sm font-bold text-black/55">
            (다음 단계) 내 거래처/내 주문만 조회로 고급스럽게 붙일 예정
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6">
            <div className="text-sm font-bold text-black/60">
              현재는 UI/라우팅 안정화가 우선이라 조회는 준비중입니다.
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-2xl font-black tracking-tight">주문요청</div>
          <div className="mt-2 text-sm font-bold text-black/55">
            거래처/품목 선택 + 배송정보 입력 후 주문요청
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="mb-2 text-sm font-black">거래처 검색</div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={clientQ}
                onChange={(e) => setClientQ(e.target.value)}
                placeholder="거래처 검색 (이름/대표자)"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 text-sm font-black">거래처(선택)</div>
              <select
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">(선택안함)</option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 text-sm font-black">품목 검색</div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={itemQ}
                onChange={(e) => setItemQ(e.target.value)}
                placeholder="품목 검색"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 text-sm font-black">품목</div>
              <select
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                <option value="">(선택)</option>
                {filteredItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm font-black">수량</div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-black">수하인명</div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="예: 홍길동"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-black">전화번호</div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(onlyDigits(e.target.value))}
                placeholder="숫자만"
                inputMode="numeric"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-black">주소 전체</div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 경기도 시흥시 ..."
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 text-sm font-black">배송메세지(선택)</div>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 취급주의"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              disabled={loading}
              onClick={submitOrder}
              className="rounded-2xl bg-black px-6 py-3 font-black text-white shadow-md disabled:opacity-50"
            >
              {loading ? "요청 중..." : "주문 요청"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}