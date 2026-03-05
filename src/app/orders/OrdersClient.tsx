"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TabKey = "request" | "list" | "clients" | "clientsNew";

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

type ItemRow = { id: string; name: string };

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

  client?: {
    id: string;
    name: string;
    ownerName?: string | null;
    address?: string | null;
    receiverTel?: string | null;
    receiverMobile?: string | null;
  } | null;

  item?: { id: string; name: string } | null;
};

type CartLine = { itemId: string; name: string; quantity: number };

function cls(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

async function apiGET<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `HTTP_${res.status}`);
  return data as T;
}

async function apiPOST<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `HTTP_${res.status}`);
  return data as T;
}

function kstTodayYmd() {
  // ✅ 한국시간 기준 "YYYY-MM-DD"
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}
function addDaysYmd(ymd: string, delta: number) {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;

    const handler = (e: Event) => {
      const el = ref.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) onClose();
    };

    window.addEventListener("pointerdown", handler, { passive: true });
    window.addEventListener("touchstart", handler, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handler as any);
      window.removeEventListener("touchstart", handler as any);
    };
  }, [open, onClose]);

  return ref;
}

function ComboBox({
  label,
  placeholder,
  items,
  valueId,
  onChangeId,
  search,
  onChangeSearch,
}: {
  label: string;
  placeholder: string;
  items: Array<{ id: string; name: string }>;
  valueId: string;
  onChangeId: (id: string) => void;
  search: string;
  onChangeSearch: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  const selected = useMemo(() => items.find((x) => x.id === valueId) || null, [items, valueId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, search]);

  const inputStyle =
    "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/30";

  return (
    <div ref={ref} className="relative">
      <div className="text-sm text-white/70">{label}</div>

      <div className="mt-2">
        <input
          className={inputStyle}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            onChangeSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      <button
        type="button"
        className={cls(
          "mt-3 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left text-white outline-none",
          "hover:bg-white/15"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? selected.name : "선택하세요"}
        <span className="float-right text-white/60">▾</span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-[#0b0f1b]/95 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.65)]">
          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-white/60 text-sm">검색 결과가 없습니다.</div>
            ) : (
              filtered.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  className="w-full px-4 py-3 text-left text-white/90 hover:bg-white/10"
                  onClick={() => {
                    onChangeId(it.id);
                    setOpen(false);
                  }}
                >
                  <div className="font-semibold">{it.name}</div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function OrdersClient() {
  const [tab, setTab] = useState<TabKey>("request");

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 검색어
  const [clientSearch, setClientSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  // 주문 입력
  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");

  // ✅ 장바구니
  const [cart, setCart] = useState<CartLine[]>([]);

  // 거래처 등록 폼
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCareNo, setNewCareNo] = useState("");
  const [newBizNo, setNewBizNo] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const [newReceiverName, setNewReceiverName] = useState("");
  const [newReceiverAddr, setNewReceiverAddr] = useState("");
  const [newReceiverTel, setNewReceiverTel] = useState("");
  const [newReceiverMobile, setNewReceiverMobile] = useState("");

  // 조회 기간 (KST)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ✅ 로그아웃: GET 이동 고정
  function logout() {
    window.location.href = "/api/logout";
  }

  // ✅ 거래처 선택 변경 시 배송정보 자동으로 무조건 덮어쓰기
  useEffect(() => {
    const c = clients.find((x) => x.id === clientId) || null;

    if (!clientId || !c) {
      setReceiverName("");
      setReceiverAddr("");
      setPhone("");
      setMobile("");
      return;
    }

    setReceiverName(c.receiverName ?? "");
    setReceiverAddr(c.receiverAddr ?? "");
    setPhone(c.receiverTel ?? "");
    setMobile(c.receiverMobile ?? "");
  }, [clientId, clients]);

  async function refreshBase() {
    setErrMsg(null);
    setLoadingBase(true);
    try {
      const c = await apiGET<{ ok: true; clients: ClientRow[] }>("/api/sales/clients");
      const i = await apiGET<{ ok: true; items: ItemRow[] }>("/api/items");
      setClients(c.clients || []);
      setItems(i.items || []);
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_LOAD_BASE");
    } finally {
      setLoadingBase(false);
    }
  }

  async function refreshOrders() {
    setErrMsg(null);
    setLoadingOrders(true);
    try {
      const qs =
        fromDate && toDate ? `?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}` : "";
      const o = await apiGET<{ ok: true; orders: OrderRow[] }>(`/api/orders${qs}`);
      setOrders(o.orders || []);
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_LOAD_ORDERS");
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    refreshBase();
    const today = kstTodayYmd();
    setToDate(today);
    setFromDate(addDaysYmd(today, -7));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 장바구니 담기(같은 품목이면 수량 누적)
  function addToCart() {
    setErrMsg(null);

    if (!clientId) {
      setErrMsg("거래처를 먼저 선택하세요.");
      return;
    }
    if (!itemId) {
      setErrMsg("품목을 선택하세요.");
      return;
    }
    const it = items.find((x) => x.id === itemId);
    if (!it) {
      setErrMsg("품목을 다시 선택하세요.");
      return;
    }
    const q = Math.max(1, Math.floor(Number(quantity || 1)));

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.itemId === itemId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + q };
        return next;
      }
      return [...prev, { itemId, name: it.name, quantity: q }];
    });

    // 담은 뒤 입력 수량만 1로
    setQuantity(1);
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((x) => x.itemId !== itemId));
  }

  function incCart(itemId: string) {
    setCart((prev) => prev.map((x) => (x.itemId === itemId ? { ...x, quantity: x.quantity + 1 } : x)));
  }

  function decCart(itemId: string) {
    setCart((prev) =>
      prev.map((x) => (x.itemId === itemId ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))
    );
  }

  function clearCart() {
    setCart([]);
  }

  // ✅ 장바구니 주문요청 (cart 있으면 복수 생성, 없으면 기존 단품 주문요청)
  async function submitOrder() {
    setErrMsg(null);
    try {
      if (!clientId) {
        setErrMsg("거래처를 선택하세요.");
        return;
      }
      if (!receiverName.trim()) {
        setErrMsg("수하인(필수)을 입력하세요.");
        return;
      }
      if (!receiverAddr.trim()) {
        setErrMsg("주소(필수)를 입력하세요.");
        return;
      }

      if (cart.length > 0) {
        await apiPOST("/api/orders", {
          clientId,
          receiverName,
          receiverAddr,
          phone,
          mobile,
          note,
          items: cart.map((x) => ({ itemId: x.itemId, quantity: x.quantity })),
        });
        clearCart();
      } else {
        // 기존 단품 주문요청 호환
        if (!itemId) {
          setErrMsg("품목을 선택하세요.");
          return;
        }
        await apiPOST("/api/orders", {
          clientId,
          itemId,
          quantity,
          receiverName,
          receiverAddr,
          phone,
          mobile,
          note,
        });
      }

      setTab("list");
      await refreshOrders();
      setQuantity(1);
      setNote("");
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_SUBMIT_ORDER");
    }
  }

  async function createClient() {
    setErrMsg(null);
    try {
      const r = await apiPOST<{ ok: true; client: ClientRow }>("/api/sales/clients", {
        name: newName,
        address: newAddress,
        careInstitutionNo: newCareNo,
        bizRegNo: newBizNo,
        ownerName: newOwner,
        receiverName: newReceiverName,
        receiverAddr: newReceiverAddr,
        receiverTel: newReceiverTel,
        receiverMobile: newReceiverMobile,
      });

      await refreshBase();
      setClientId(r.client.id);
      setTab("request");

      setNewName("");
      setNewAddress("");
      setNewCareNo("");
      setNewBizNo("");
      setNewOwner("");
      setNewReceiverName("");
      setNewReceiverAddr("");
      setNewReceiverTel("");
      setNewReceiverMobile("");
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_CREATE_CLIENT");
    }
  }

  // ===== UI styles
  const shell = "min-h-[100svh] w-full px-4 py-6";
  const card =
    "w-full max-w-6xl mx-auto rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]";
  const inner = "p-6 md:p-8";
  const panel = "rounded-2xl border border-white/10 bg-white/10 p-5 md:p-6";
  const label = "text-sm text-white/70";
  const input =
    "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/30";
  const textarea =
    "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/30 min-h-[90px]";
  const btn =
    "rounded-xl px-4 py-3 font-semibold transition border border-white/15 bg-white/15 hover:bg-white/20 active:scale-[0.99]";
  const btnPrimary =
    "rounded-xl px-4 py-3 font-semibold transition border border-white/20 bg-white text-black hover:opacity-95 active:scale-[0.99]";
  const tabBtn = (active: boolean) =>
    cls(
      "px-4 py-2 rounded-full text-sm font-semibold transition border",
      active ? "bg-white text-black border-white" : "bg-white/10 text-white border-white/15 hover:bg-white/15"
    );

  // 조회 출력용 (상태 한글)
  function statusKo(s: string) {
    const u = String(s || "").toUpperCase();
    if (u === "REQUESTED") return "대기";
    if (u === "APPROVED") return "승인";
    if (u === "REJECTED") return "거절";
    if (u === "DONE") return "완료";
    return s;
  }

  // clients 목록 필터 (거래처 탭에서도 사용)
  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const cartTotal = useMemo(() => cart.reduce((sum, x) => sum + (x.quantity || 0), 0), [cart]);

  return (
    <div
      className={cls(shell)}
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 20%, rgba(120,105,255,0.22), transparent 55%), radial-gradient(900px 600px at 80% 30%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(900px 700px at 50% 90%, rgba(255,255,255,0.08), transparent 55%), linear-gradient(180deg, rgb(8,10,18), rgb(12,14,24))",
      }}
    >
      <div className={card}>
        <div className={inner}>
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-extrabold text-white">주문</div>
              <div className="text-white/60 text-sm mt-1">거래처/품목 선택 + 배송정보 입력 후 주문요청</div>
            </div>
            <button className={cls(btn, "h-[44px]")} onClick={logout}>
              로그아웃
            </button>
          </div>

          {/* 탭 */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button className={tabBtn(tab === "request")} onClick={() => setTab("request")}>
              주문요청
            </button>
            <button
              className={tabBtn(tab === "list")}
              onClick={async () => {
                setTab("list");
                await refreshOrders();
              }}
            >
              조회
            </button>
            <button className={tabBtn(tab === "clients")} onClick={() => setTab("clients")}>
              거래처 목록
            </button>
            <button className={tabBtn(tab === "clientsNew")} onClick={() => setTab("clientsNew")}>
              거래처 등록
            </button>
          </div>

          {/* 에러 */}
          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
              {errMsg}
            </div>
          ) : null}

          {/* 로딩 */}
          {loadingBase ? (
            <div className="mt-6 text-white/70">불러오는 중...</div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
              {/* ------------------- 주문요청 ------------------- */}
              {tab === "request" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-5">
                    <ComboBox
                      label="거래처 검색/선택"
                      placeholder="거래처명을 입력하세요"
                      items={clients.map((c) => ({ id: c.id, name: c.name }))}
                      valueId={clientId}
                      onChangeId={(id) => {
                        setClientId(id);
                        // ✅ 거래처 바꾸면 장바구니는 유지해도 되지만, 실수 방지로 비우는게 안전
                        // 원하면 아래 1줄 주석처리하면 됨.
                        setCart([]);
                      }}
                      search={clientSearch}
                      onChangeSearch={setClientSearch}
                    />

                    <div>
                      <div className={label}>수량</div>
                      <div className="mt-2 flex items-center gap-3">
                        <button className={btn} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                          -
                        </button>
                        <input
                          className={input}
                          style={{ width: 140, textAlign: "center" as const }}
                          value={String(quantity)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!Number.isFinite(n)) return;
                            setQuantity(Math.max(1, Math.floor(n)));
                          }}
                        />
                        <button className={btn} onClick={() => setQuantity((q) => q + 1)}>
                          +
                        </button>

                        {/* ✅ 장바구니 담기 */}
                        <button className={btnPrimary} onClick={addToCart} disabled={!clientId || !itemId}>
                          담기
                        </button>
                      </div>
                      <div className="text-white/45 text-xs mt-2">
                        * “담기”를 누르면 장바구니에 누적됩니다 (같은 품목이면 수량 합산)
                      </div>
                    </div>

                    <ComboBox
                      label="품목 검색/선택"
                      placeholder="품목명을 입력하세요"
                      items={items}
                      valueId={itemId}
                      onChangeId={setItemId}
                      search={itemSearch}
                      onChangeSearch={setItemSearch}
                    />

                    {/* ✅ 장바구니 표시 */}
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white font-bold">장바구니</div>
                        <div className="text-white/60 text-sm">총 {cartTotal}개</div>
                      </div>

                      {cart.length === 0 ? (
                        <div className="text-white/55 text-sm mt-3">아직 담긴 품목이 없습니다.</div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {cart.map((c) => (
                            <div
                              key={c.itemId}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="text-white/90 font-semibold truncate">{c.name}</div>
                                <div className="text-white/55 text-xs">수량: {c.quantity}</div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button className={btn} onClick={() => decCart(c.itemId)}>
                                  -
                                </button>
                                <button className={btn} onClick={() => incCart(c.itemId)}>
                                  +
                                </button>
                                <button className={btn} onClick={() => removeFromCart(c.itemId)}>
                                  삭제
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-2">
                            <button className={btn} onClick={clearCart}>
                              장바구니 비우기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={panel}>
                    <div className="text-white font-bold">배송 정보</div>
                    <div className="text-white/60 text-sm mt-1">거래처 선택 시 수하인/주소/연락처 자동 채움됩니다.</div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className={label}>수하인 (필수)</div>
                        <input className={input} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                      </div>
                      <div>
                        <div className={label}>주소 (필수)</div>
                        <input className={input} value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} />
                      </div>
                      <div>
                        <div className={label}>전화</div>
                        <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div>
                        <div className={label}>휴대폰</div>
                        <input className={input} value={mobile} onChange={(e) => setMobile(e.target.value)} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className={label}>주문 요청(메모)</div>
                      <textarea className={textarea} value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>

                    <div className="mt-5 flex gap-3 flex-wrap">
                      {/* ✅ cart 있으면 “장바구니 주문요청”, 없으면 기존 단품 주문요청 */}
                      <button
                        className={btnPrimary}
                        onClick={submitOrder}
                        disabled={!clientId || (!itemId && cart.length === 0)}
                        title={cart.length > 0 ? "장바구니 품목들이 한 번에 주문요청됩니다" : "선택한 단일 품목이 주문요청됩니다"}
                      >
                        {cart.length > 0 ? "장바구니 주문 요청" : "주문 요청"}
                      </button>

                      <button
                        className={btn}
                        onClick={() => {
                          setClientId("");
                          setItemId("");
                          setQuantity(1);
                          setReceiverName("");
                          setReceiverAddr("");
                          setPhone("");
                          setMobile("");
                          setNote("");
                          setCart([]);
                        }}
                      >
                        초기화
                      </button>
                    </div>

                    <div className="text-white/45 text-xs mt-3">
                      * 장바구니가 비어있으면 기존처럼 “단품 주문요청”으로 동작합니다.
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------- 조회 ------------------- */}
              {tab === "list" && (
                <div>
                  <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-5">
                    <div className="flex gap-3 flex-wrap">
                      <div>
                        <div className={label}>시작일 (한국시간)</div>
                        <input type="date" className={input} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      </div>
                      <div>
                        <div className={label}>종료일 (한국시간)</div>
                        <input type="date" className={input} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className={btnPrimary} onClick={refreshOrders}>
                        기간 조회
                      </button>
                      <button
                        className={btn}
                        onClick={() => {
                          const today = kstTodayYmd();
                          setToDate(today);
                          setFromDate(addDaysYmd(today, -7));
                        }}
                      >
                        오늘 기준 초기화
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    {loadingOrders ? (
                      <div className="text-white/70">조회 중...</div>
                    ) : orders.length === 0 ? (
                      <div className="text-white/70">조회 결과가 없습니다.</div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 overflow-hidden">
                        <div className="hidden md:grid md:grid-cols-12 gap-0 bg-white/5 px-4 py-3 text-white/70 text-sm">
                          <div className="col-span-2">날짜</div>
                          <div className="col-span-1">상태</div>
                          <div className="col-span-2">거래처</div>
                          <div className="col-span-2">대표/전화</div>
                          <div className="col-span-3">주소</div>
                          <div className="col-span-2">품목/수량</div>
                        </div>

                        {orders.map((o) => (
                          <div key={o.id} className="border-t border-white/10 px-4 py-4">
                            {/* 모바일 */}
                            <div className="md:hidden space-y-1 text-white/85">
                              <div className="font-bold">
                                {o.client?.name || "-"} · {o.item?.name || "-"} x{o.quantity}
                              </div>
                              <div className="text-white/60 text-sm">
                                {new Date(o.createdAt).toLocaleDateString("ko-KR")} · {statusKo(o.status)}
                              </div>
                              <div className="text-white/70 text-sm">
                                대표: {o.client?.ownerName || "-"} / 전화: {o.client?.receiverTel || "-"}
                              </div>
                              <div className="text-white/70 text-sm">주소: {o.client?.address || "-"}</div>
                            </div>

                            {/* PC */}
                            <div className="hidden md:grid md:grid-cols-12 text-white/85">
                              <div className="col-span-2">{new Date(o.createdAt).toLocaleDateString("ko-KR")}</div>
                              <div className="col-span-1">{statusKo(o.status)}</div>
                              <div className="col-span-2 font-semibold">{o.client?.name || "-"}</div>
                              <div className="col-span-2 text-white/75 text-sm">
                                {o.client?.ownerName || "-"}
                                <div className="text-white/60">{o.client?.receiverTel || "-"}</div>
                              </div>
                              <div className="col-span-3 text-white/75 text-sm">{o.client?.address || "-"}</div>
                              <div className="col-span-2 font-semibold">
                                {o.item?.name || "-"} x{o.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------- 거래처 목록 ------------------- */}
              {tab === "clients" && (
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex-1">
                      <div className={label}>거래처 검색</div>
                      <input className={input} value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                    </div>
                    <button className={btn} onClick={refreshBase}>
                      새로고침
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredClients.map((c) => (
                      <div key={c.id} className={panel}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-white font-bold text-lg">{c.name}</div>
                            <div className="text-white/60 text-sm mt-1">
                              대표: {c.ownerName || "-"} · 요양기관번호: {c.careInstitutionNo || "-"} · 사업자등록번호:{" "}
                              {c.bizRegNo || "-"}
                            </div>
                            <div className="text-white/60 text-sm mt-1">거래처 주소: {c.address || "-"}</div>
                          </div>
                          <button
                            className={btnPrimary}
                            onClick={() => {
                              setClientId(c.id);
                              setTab("request");
                            }}
                          >
                            주문요청에서 선택
                          </button>
                        </div>

                        <div className="mt-4 text-white/75 text-sm space-y-1">
                          <div>수하인: {c.receiverName || "-"}</div>
                          <div>배송지: {c.receiverAddr || "-"}</div>
                          <div>전화: {c.receiverTel || "-"}</div>
                          <div>휴대폰: {c.receiverMobile || "-"}</div>
                        </div>
                      </div>
                    ))}

                    {clients.length === 0 ? <div className="text-white/70">거래처가 없습니다.</div> : null}
                  </div>
                </div>
              )}

              {/* ------------------- 거래처 등록 ------------------- */}
              {tab === "clientsNew" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className={panel}>
                    <div className="text-white font-bold">거래처 등록</div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className={label}>거래처명 (필수)</div>
                        <input className={input} value={newName} onChange={(e) => setNewName(e.target.value)} />
                      </div>

                      <div>
                        <div className={label}>거래처 주소</div>
                        <input className={input} value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className={label}>요양기관번호</div>
                          <input className={input} value={newCareNo} onChange={(e) => setNewCareNo(e.target.value)} />
                        </div>
                        <div>
                          <div className={label}>사업자등록번호</div>
                          <input className={input} value={newBizNo} onChange={(e) => setNewBizNo(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <div className={label}>대표자</div>
                        <input className={input} value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className={label}>수하인</div>
                          <input className={input} value={newReceiverName} onChange={(e) => setNewReceiverName(e.target.value)} />
                        </div>
                        <div>
                          <div className={label}>배송지 주소</div>
                          <input className={input} value={newReceiverAddr} onChange={(e) => setNewReceiverAddr(e.target.value)} />
                        </div>
                        <div>
                          <div className={label}>전화</div>
                          <input className={input} value={newReceiverTel} onChange={(e) => setNewReceiverTel(e.target.value)} />
                        </div>
                        <div>
                          <div className={label}>휴대폰</div>
                          <input
                            className={input}
                            value={newReceiverMobile}
                            onChange={(e) => setNewReceiverMobile(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button className={btnPrimary} onClick={createClient} disabled={!newName.trim()}>
                          거래처 등록
                        </button>
                        <button
                          className={btn}
                          onClick={() => {
                            setNewName("");
                            setNewAddress("");
                            setNewCareNo("");
                            setNewBizNo("");
                            setNewOwner("");
                            setNewReceiverName("");
                            setNewReceiverAddr("");
                            setNewReceiverTel("");
                            setNewReceiverMobile("");
                          }}
                        >
                          초기화
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={panel}>
                    <div className="text-white font-bold">안내</div>
                    <div className="mt-3 text-white/70 text-sm space-y-2">
                      <div>• 등록하면 거래처 목록/주문요청에 즉시 반영됩니다.</div>
                      <div>• 주문요청에서 거래처 변경하면 배송정보가 즉시 자동 채움됩니다.</div>
                      <div>• 조회 달력 기본값은 한국시간 기준(오늘, 최근 7일)입니다.</div>
                      <div>• 장바구니는 “담기”로 누적 후 “장바구니 주문 요청” 한 번에 등록됩니다.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}