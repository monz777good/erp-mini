"use client";

import { useEffect, useMemo, useState } from "react";

type OrderRowAny = any;

type ClientRow = {
  id: string;
  name: string;
  address?: string | null;
  ownerName?: string | null;
  careInstitutionNo?: string | null;
  bizRegNo?: string | null;

  receiverName?: string | null;
  receiverAddr?: string | null;
  receiverTel?: string | null;
  receiverMobile?: string | null;

  bizFileUrl?: string | null;
  bizFileName?: string | null;
  bizFileUploadedAt?: string | null;

  createdAt?: string;
};

type ItemRow = {
  id: string;
  name: string;
};

type CartLine = {
  itemId: string;
  name: string;
  quantity: number;
};

function kstYmd(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return k.toISOString().slice(0, 10);
}

function toKstLabel(iso: string) {
  try {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(dt);
  } catch {
    return iso;
  }
}

export default function OrdersClient() {
  const [tab, setTab] = useState<"new" | "list" | "clients" | "clientsNew">(
    "new"
  );

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);

  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);

  const [fromYmd, setFromYmd] = useState(() => {
    const today = kstYmd(new Date());
    const dt = new Date(`${today}T00:00:00+09:00`);
    dt.setDate(dt.getDate() - 7);
    return kstYmd(dt);
  });
  const [toYmd, setToYmd] = useState(() => kstYmd(new Date()));
  const [q, setQ] = useState("");
  const [list, setList] = useState<OrderRowAny[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) || null,
    [clients, clientId]
  );
  const selectedItem = useMemo(
    () => items.find((it) => it.id === itemId) || null,
    [items, itemId]
  );

  async function loadClients() {
    setLoadingClients(true);
    try {
      const r = await fetch("/api/sales/clients", { credentials: "include" });
      const j = await r.json();
      if (j?.ok) setClients(j.clients || []);
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadItems() {
    setLoadingItems(true);
    try {
      const r = await fetch("/api/items", { credentials: "include" });
      const j = await r.json();
      if (j?.ok) setItems(j.items || []);
    } finally {
      setLoadingItems(false);
    }
  }

  async function loadOrders() {
    setLoadingList(true);
    try {
      const url =
        `/api/orders?from=${encodeURIComponent(fromYmd)}` +
        `&to=${encodeURIComponent(toYmd)}` +
        `&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { credentials: "include" });
      const j = await r.json();
      if (j?.ok) setList(j.orders || []);
      else setList([]);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadClients();
    loadItems();
  }, []);

  useEffect(() => {
    if (tab === "list") loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function addToCart() {
    if (!selectedItem) return alert("품목을 선택하세요.");
    const qn = Math.max(1, Number(qty || 1));
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.itemId === selectedItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qn };
        return next;
      }
      return [...prev, { itemId: selectedItem.id, name: selectedItem.name, quantity: qn }];
    });
  }

  function removeCart(itemId: string) {
    setCart((prev) => prev.filter((x) => x.itemId !== itemId));
  }

  function cartTotalCount() {
    return cart.reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  }

  async function submitOrder() {
    if (!clientId) return alert("거래처를 선택하세요.");
    if (cart.length === 0) return alert("장바구니에 품목을 담아주세요.");

    const payload: any = {
      clientId,
      items: cart.map((x) => ({
        itemId: x.itemId,
        quantity: Number(x.quantity) || 1,
      })),
    };

    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) {
      alert(j?.error || "주문요청 실패");
      return;
    }

    alert("주문요청 완료");
    setCart([]);
    setItemId("");
    setQty(1);
    setTab("list");
  }

  // ✅✅✅ 여기만 “품목(수량)” 표시를 확실히 잡는 로직 (다른건 절대 안건드림)
  function orderItemsText(o: OrderRowAny) {
    // 1) 멀티라인(장바구니) 형태: items/lines/orderItems 등
    const lines = (o?.items || o?.lines || o?.orderItems || []) as any[];
    if (Array.isArray(lines) && lines.length > 0) {
      return lines
        .map((x) => {
          const nm = x?.name || x?.itemName || x?.item?.name || "";
          const qt = x?.quantity ?? x?.qty ?? x?.count ?? "";
          return nm ? `${nm} (${qt})` : "";
        })
        .filter(Boolean)
        .join(", ");
    }

    // 2) 단품 형태: itemName / item: {name} / itemId 역조회
    const qt1 = o?.quantity ?? o?.qty ?? o?.count;
    if (o?.itemName) return `${o.itemName} (${qt1 ?? ""})`;
    if (o?.item?.name) return `${o.item.name} (${qt1 ?? ""})`;

    const nm3 = items.find((it) => it.id === o?.itemId)?.name;
    if (nm3) return `${nm3} (${qt1 ?? ""})`;

    return "-";
  }

  return (
    <div className="w-full">
      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "new" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("new")}
        >
          주문요청
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "list" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("list")}
        >
          조회
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "clients" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("clients")}
        >
          거래처 목록
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm ${
            tab === "clientsNew" ? "bg-white text-black" : "bg-white/10 text-white"
          }`}
          onClick={() => setTab("clientsNew")}
        >
          거래처 등록
        </button>
      </div>

      {/* 주문요청 */}
      {tab === "new" && (
        <div className="space-y-4">
          <div className="text-sm text-white/70">
            거래처/품목 선택 + 배송정보 입력 후 주문요청
          </div>

          <div className="space-y-2">
            <div className="text-sm text-white/80">거래처 검색/선택</div>
            <select
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">거래처를 선택하세요</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-white/80">품목 선택</div>
            <select
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <option value="">품목을 선택하세요</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 text-white"
                onClick={() => setQty((v) => Math.max(1, Number(v) - 1))}
              >
                -
              </button>
              <div className="w-12 text-center text-white">{qty}</div>
              <button
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 text-white"
                onClick={() => setQty((v) => Math.max(1, Number(v) + 1))}
              >
                +
              </button>

              <button
                className="px-5 h-10 rounded-xl bg-white text-black font-semibold"
                onClick={addToCart}
              >
                담기
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white font-semibold">장바구니</div>
              <div className="text-white/70 text-sm">총 {cartTotalCount()}개</div>
            </div>

            {cart.length === 0 ? (
              <div className="text-white/50 text-sm">담긴 품목이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {cart.map((x) => (
                  <div
                    key={x.itemId}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2"
                  >
                    <div className="text-white text-sm">
                      {x.name} <span className="text-white/70">x{x.quantity}</span>
                    </div>
                    <button
                      className="text-white/70 text-sm hover:text-white"
                      onClick={() => removeCart(x.itemId)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-3">
              <button
                className="px-6 py-2 rounded-xl bg-emerald-400 text-black font-bold"
                onClick={submitOrder}
              >
                주문요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 조회 */}
      {tab === "list" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="text-sm text-white/80 mr-2">기간 (한국시간 기준)</div>
            <input
              type="date"
              className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white"
              value={fromYmd}
              onChange={(e) => setFromYmd(e.target.value)}
            />
            <div className="text-white/60 px-2">~</div>
            <input
              type="date"
              className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white"
              value={toYmd}
              onChange={(e) => setToYmd(e.target.value)}
            />
            <input
              className="flex-1 min-w-[260px] bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white"
              placeholder="검색(품목/거래처/수하인/전화/주소/비고)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              className="px-5 py-2 rounded-xl bg-white/10 border border-white/10 text-white"
              onClick={loadOrders}
            >
              조회
            </button>
          </div>

          <div className="overflow-auto rounded-2xl border border-white/10">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-white/80">
                  <th className="text-left px-3 py-2">등록일</th>
                  <th className="text-left px-3 py-2">거래처</th>
                  <th className="text-left px-3 py-2">품목(수량)</th>
                  <th className="text-left px-3 py-2">상태</th>
                  <th className="text-left px-3 py-2">수하인</th>
                  <th className="text-left px-3 py-2">주소</th>
                  <th className="text-left px-3 py-2">전화</th>
                  <th className="text-left px-3 py-2">핸드폰</th>
                  <th className="text-left px-3 py-2">비고</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td className="px-3 py-6 text-white/60" colSpan={9}>
                      불러오는 중...
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-white/60" colSpan={9}>
                      조회 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  list.map((o: any) => (
                    <tr key={o.id} className="border-t border-white/10 text-white">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {toKstLabel(o.createdAt)}
                      </td>
                      <td className="px-3 py-2">{o.clientName || o.client?.name || "-"}</td>
                      <td className="px-3 py-2">{orderItemsText(o)}</td>
                      <td className="px-3 py-2">{o.statusKorean || o.status || "-"}</td>
                      <td className="px-3 py-2">{o.receiverName || "-"}</td>
                      <td className="px-3 py-2">{o.receiverAddr || "-"}</td>
                      <td className="px-3 py-2">{o.phone || o.receiverTel || "-"}</td>
                      <td className="px-3 py-2">{o.mobile || o.receiverMobile || "-"}</td>
                      <td className="px-3 py-2">{o.note || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-white/50">
            * 조회는 관리자 화면에서 승인/거절/출고 처리합니다.
          </div>
        </div>
      )}

      {/* 거래처 목록/등록은 기존 프로젝트 흐름 유지 */}
      {tab === "clients" && (
        <div className="text-white/70">
          거래처 목록 화면은 기존 구성 그대로 사용 중입니다.
        </div>
      )}

      {tab === "clientsNew" && (
        <div className="text-white/70">
          거래처 등록 화면은 기존 구성 그대로 사용 중입니다.
        </div>
      )}
    </div>
  );
}