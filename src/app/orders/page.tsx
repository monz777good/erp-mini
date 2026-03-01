// src/app/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; name: string };
type Client = { id: string; name: string };
type Order = {
  id: string;
  status: string;
  createdAt: string;
  quantity: number;
  note?: string | null;
  receiverName: string;
  receiverAddr: string;
  receiverPhone: string;
  item?: { name: string } | null;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function OrdersPage() {
  const title = useMemo(() => "한의N원외탕전 ERP", []);
  const [tab, setTab] = useState<"order" | "history" | "client">("order");

  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ “서버 오류/Unauthorized” 같은 텍스트를 화면에 절대 뿌리지 않음
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  const pill = (active: boolean) =>
    cn(
      "px-4 py-2 rounded-full text-sm font-extrabold transition",
      active ? "bg-white text-black shadow" : "bg-white/50 text-black hover:bg-white/70"
    );

  const input =
    "w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-black outline-none focus:ring-2 focus:ring-black/10";

  const label = "text-sm font-extrabold text-black/80";

  async function loadItemsSilent() {
    const res = await fetch("/api/items", { credentials: "include" }).catch(() => null);
    if (!res) return setItems([]);

    if (res.status === 401) {
      // 로그인 필요지만 배너/빨간 글씨 안 띄움
      setItems([]);
      setUiMessage(null);
      return;
    }
    if (!res.ok) {
      setItems([]);
      setUiMessage("서버 오류");
      return;
    }

    const data = await safeJson(res);
    const arr = Array.isArray(data) ? data : data?.items ?? [];
    setItems(arr);
    if (!itemId && arr?.[0]?.id) setItemId(arr[0].id);
    setUiMessage(null);
  }

  async function loadClientsSilent() {
    const res = await fetch("/api/sales/clients", { credentials: "include" }).catch(() => null);
    if (!res) return setClients([]);

    if (res.status === 401) {
      setClients([]);
      setUiMessage(null);
      return;
    }
    if (!res.ok) {
      setClients([]);
      // 거래처는 실패해도 화면을 망치지 않음
      return;
    }

    const data = await safeJson(res);
    const arr = Array.isArray(data) ? data : data?.clients ?? [];
    setClients(arr);
  }

  async function loadOrdersSilent() {
    const urls = ["/api/sales/orders", "/api/orders"];
    for (const url of urls) {
      const res = await fetch(url, { credentials: "include" }).catch(() => null);
      if (!res) continue;

      if (res.status === 401) {
        setOrders([]);
        setUiMessage(null);
        return;
      }
      if (!res.ok) continue;

      const data = await safeJson(res);
      const arr = Array.isArray(data) ? data : data?.orders ?? data ?? [];
      if (Array.isArray(arr)) {
        setOrders(arr);
        return;
      }
    }
    setOrders([]);
  }

  async function refresh() {
    if (tab === "order") {
      await loadItemsSilent();
      await loadClientsSilent();
    } else if (tab === "history") {
      await loadOrdersSilent();
    } else {
      await loadClientsSilent();
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => null);
    location.href = "/login";
  }

  async function submitOrder() {
    if (!itemId) return alert("품목을 선택해주세요.");
    if (!receiverName.trim()) return alert("수하인명을 입력해주세요.");
    if (!receiverAddr.trim()) return alert("주소를 입력해주세요.");
    if (!receiverPhone.trim()) return alert("전화번호를 입력해주세요.");
    if (!quantity || quantity < 1) return alert("수량은 1 이상이어야 합니다.");

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          quantity,
          receiverName: receiverName.trim(),
          receiverAddr: receiverAddr.trim(),
          receiverPhone: receiverPhone.trim(),
          note: note.trim() ? note.trim() : null,
        }),
      });

      if (res.status === 401) {
        alert("로그인이 필요합니다. 다시 로그인해주세요.");
        location.href = "/login";
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(t || "주문 등록 실패");
        return;
      }

      alert("주문 요청 완료");
      setNote("");
      await loadOrdersSilent();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItemsSilent();
    loadClientsSilent();
  }, []);

  useEffect(() => {
    if (tab === "history") loadOrdersSilent();
    if (tab === "client") loadClientsSilent();
  }, [tab]);

  return (
    <div className="min-h-screen">
      {/* ✅ 고급스러운 배경 (전처럼) */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.10)), url('/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/5" />

      {/* ✅ 여백 문제 방지: 상단부터 컨테이너로 정렬 */}
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-10">
        {/* TOP BAR */}
        <div className="sticky top-0 z-10">
          <div className="rounded-3xl border border-white/40 bg-white/35 backdrop-blur-xl shadow-sm px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="text-xl font-black text-black">{title}</div>
                <button className={pill(tab === "order")} onClick={() => setTab("order")}>
                  주문
                </button>
                <button className={pill(tab === "history")} onClick={() => setTab("history")}>
                  조회
                </button>
                <button className={pill(tab === "client")} onClick={() => setTab("client")}>
                  거래처 등록
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className={pill(false)} onClick={refresh} type="button">
                  새로고침
                </button>
                <button className={pill(false)} onClick={logout} type="button">
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="mt-5 rounded-[28px] border border-white/45 bg-white/60 backdrop-blur-xl shadow-xl">
          {/* 메시지 (서버오류만 표시, Unauthorized는 절대 표시 안함) */}
          {uiMessage && (
            <div className="px-6 pt-6">
              <div className="rounded-2xl border border-red-200 bg-white/80 px-4 py-3 text-red-600 font-extrabold">
                {uiMessage}
              </div>
            </div>
          )}

          <div className="p-6">
            {tab === "order" && (
              <>
                <div className="text-2xl font-black text-black mb-5">주문요청</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className={label}>품목</div>
                    <select className={input} value={itemId} onChange={(e) => setItemId(e.target.value)}>
                      <option value="">(선택)</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className={label}>수량</div>
                    <input className={input} type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 1))} />
                  </div>

                  <div>
                    <div className={label}>수하인명</div>
                    <input className={input} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                  </div>

                  <div>
                    <div className={label}>전화번호</div>
                    <input className={input} value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="01012345678" />
                  </div>

                  <div className="md:col-span-2">
                    <div className={label}>주소 전체</div>
                    <input className={input} value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} placeholder="주소 전체" />
                  </div>

                  <div className="md:col-span-2">
                    <div className={label}>배송메세지(선택)</div>
                    <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 취급주의" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={submitOrder}
                    disabled={loading}
                    className="rounded-2xl bg-black px-6 py-3 font-extrabold text-white shadow hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "처리중..." : "주문 요청"}
                  </button>
                </div>
              </>
            )}

            {tab === "history" && (
              <>
                <div className="text-2xl font-black text-black mb-5">주문 조회</div>
                {orders.length === 0 ? (
                  <div className="text-black/60 font-semibold">조회된 주문이 없습니다.</div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="rounded-2xl border border-black/10 bg-white/80 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black text-black">
                            {o.item?.name ?? "품목"} / {o.receiverName}
                          </div>
                          <div className="text-sm font-extrabold text-black/70">{o.status}</div>
                        </div>
                        <div className="text-sm text-black/70 mt-1">{o.receiverAddr}</div>
                        <div className="text-sm text-black/60 mt-1">
                          수량: {o.quantity} {o.note ? ` / 메모: ${o.note}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "client" && (
              <>
                <div className="text-2xl font-black text-black mb-5">거래처</div>
                {clients.length === 0 ? (
                  <div className="text-black/60 font-semibold">거래처가 없거나 불러오지 못했습니다.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clients.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-black/10 bg-white/80 p-4">
                        <div className="font-black text-black">{c.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}