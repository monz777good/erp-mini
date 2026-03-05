// src/app/orders/OrdersClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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

type OrderRowAny = any;

function s(v: any) {
  return String(v ?? "").trim();
}

// ---- KST helpers ----
function kstTodayYmd() {
  const now = new Date();
  // UTC ms + 9h
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
function addDaysYmd(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00+09:00`);
  d.setDate(d.getDate() + days);
  // keep KST date
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function cls(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

async function apiGET<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as any)?.ok === false) {
    throw new Error((data as any)?.error || (data as any)?.message || `HTTP_${res.status}`);
  }
  return data as T;
}

async function apiPOST<T = any>(url: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as any)?.ok === false) {
    throw new Error((data as any)?.error || (data as any)?.message || `HTTP_${res.status}`);
  }
  return data as T;
}

// ---- ComboBox (네이티브 select 금지: 하얀 박스 방지) ----
function ComboBox(props: {
  label: string;
  placeholder: string;
  items: Array<{ id: string; name: string }>;
  valueId: string;
  onChangeId: (id: string) => void;
  search: string;
  onChangeSearch: (v: string) => void;
}) {
  const { label, placeholder, items, valueId, onChangeId, search, onChangeSearch } = props;
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => items.find((x) => x.id === valueId) || null, [items, valueId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 200);
    return items.filter((x) => x.name.toLowerCase().includes(q)).slice(0, 200);
  }, [items, search]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="space-y-2">
      <div className="text-sm font-extrabold text-white/85">{label}</div>

      <div className="relative">
        <button
          type="button"
          className={cls(
            "w-full h-[48px] px-4 rounded-2xl border text-left font-extrabold",
            "bg-white/5 border-white/12 text-white",
            "hover:bg-white/8 active:bg-white/10",
            "flex items-center justify-between gap-3"
          )}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={cls("truncate", selected ? "text-white" : "text-white/55")}>
            {selected ? selected.name : placeholder}
          </span>
          <span className="text-white/45">▾</span>
        </button>

        {open ? (
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/12 bg-[rgba(15,18,30,0.98)] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-white/10">
              <input
                value={search}
                onChange={(e) => onChangeSearch(e.target.value)}
                placeholder="검색..."
                className={cls(
                  "w-full h-[44px] px-4 rounded-2xl border",
                  "bg-white/5 border-white/12 text-white font-extrabold outline-none",
                  "placeholder:text-white/35"
                )}
                autoFocus
              />
            </div>
            <div className="max-h-[320px] overflow-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-white/60 font-bold">검색 결과 없음</div>
              ) : (
                filtered.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    className={cls(
                      "w-full px-4 py-3 text-left border-b border-white/8",
                      "hover:bg-white/8",
                      it.id === valueId ? "bg-white/10" : "bg-transparent"
                    )}
                    onClick={() => {
                      onChangeId(it.id);
                      setOpen(false);
                    }}
                  >
                    <div className="text-white font-extrabold truncate">{it.name}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OrdersClient() {
  const [tab, setTab] = useState<"request" | "list" | "clients" | "clientsNew">("request");

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [orders, setOrders] = useState<OrderRowAny[]>([]);

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 주문요청
  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);

  // 배송정보
  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");

  // 검색
  const [clientSearch, setClientSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  // 조회 기간/검색
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [q, setQ] = useState("");

  // 거래처 등록 + 사업자등록증
  const [cName, setCName] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cOwnerName, setCOwnerName] = useState("");
  const [cCareNo, setCCareNo] = useState("");
  const [cBizNo, setCBizNo] = useState("");
  const [cRecvName, setCRecvName] = useState("");
  const [cRecvAddr, setCRecvAddr] = useState("");
  const [cRecvTel, setCRecvTel] = useState("");
  const [cRecvMobile, setCRecvMobile] = useState("");
  const [bizFile, setBizFile] = useState<File | null>(null);

  const cartTotal = useMemo(() => cart.reduce((sum, x) => sum + (x.quantity || 0), 0), [cart]);

  useEffect(() => {
    // 거래처 선택 시 배송정보 기본값 자동 채움
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
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
      const qs = fromDate && toDate ? `?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}` : "";
      const o = await apiGET<{ ok: true; orders: OrderRowAny[] }>(`/api/orders${qs}`);
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

  function addToCart() {
    setErrMsg(null);

    if (!clientId) return setErrMsg("거래처를 먼저 선택하세요.");
    if (!itemId) return setErrMsg("품목을 선택하세요.");

    const it = items.find((x) => x.id === itemId);
    if (!it) return setErrMsg("품목을 다시 선택하세요.");

    const qn = Math.max(1, Math.floor(Number(quantity || 1)));

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.itemId === itemId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qn };
        return next;
      }
      return [...prev, { itemId, name: it.name, quantity: qn }];
    });

    setQuantity(1);
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((x) => x.itemId !== itemId));
  }
  function incCart(itemId: string) {
    setCart((prev) => prev.map((x) => (x.itemId === itemId ? { ...x, quantity: x.quantity + 1 } : x)));
  }
  function decCart(itemId: string) {
    setCart((prev) => prev.map((x) => (x.itemId === itemId ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)));
  }
  function clearCart() {
    setCart([]);
  }

  function statusKo(st: string) {
    const u = String(st || "").toUpperCase();
    if (u === "REQUESTED") return "대기";
    if (u === "APPROVED") return "승인";
    if (u === "REJECTED") return "거절";
    if (u === "DONE") return "완료";
    return st;
  }

  function orderItemsText(o: OrderRowAny) {
    // 다양한 형태를 다 흡수
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
    // 단품 호환
    if (o?.itemName) return `${o.itemName} (${o?.quantity ?? ""})`;
    return "-";
  }

  const filteredOrders = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return orders;

    return orders.filter((o) => {
      const t = [
        o?.clientName,
        o?.client?.name,
        orderItemsText(o),
        o?.receiverName,
        o?.receiverAddr,
        o?.phone,
        o?.mobile,
        o?.note,
        o?.careInstitutionNo,
        o?.bizRegNo,
      ]
        .map((x) => String(x ?? "").toLowerCase())
        .join(" | ");
      return t.includes(qq);
    });
  }, [orders, q]);

  async function submitOrder() {
    setErrMsg(null);
    setLoading(true);
    try {
      if (!clientId) throw new Error("거래처를 선택하세요.");
      if (!receiverName.trim()) throw new Error("수하인(필수)을 입력하세요.");
      if (!receiverAddr.trim()) throw new Error("주소(필수)를 입력하세요.");

      if (cart.length > 0) {
        await apiPOST("/api/orders", {
          clientId,
          receiverName,
          receiverAddr,
          phone: s(phone) || null,
          mobile: s(mobile) || null,
          note: s(note) || null,
          items: cart.map((x) => ({ itemId: x.itemId, quantity: x.quantity })),
        });
        clearCart();
      } else {
        // 단품 호환
        if (!itemId) throw new Error("품목을 선택하세요.");
        await apiPOST("/api/orders", {
          clientId,
          itemId,
          quantity,
          receiverName,
          receiverAddr,
          phone: s(phone) || null,
          mobile: s(mobile) || null,
          note: s(note) || null,
        });
      }

      setTab("list");
      await refreshOrders();
      setQuantity(1);
      setNote("");
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_SUBMIT_ORDER");
    } finally {
      setLoading(false);
    }
  }

  async function uploadBizFile(clientId: string, file: File) {
    const fd = new FormData();
    fd.append("clientId", clientId);
    fd.append("file", file);
    await apiPOST("/api/sales/clients/bizfile", fd);
  }

  async function createClient() {
    setErrMsg(null);
    setLoading(true);
    try {
      if (!s(cName)) throw new Error("거래처명은 필수입니다.");

      const r = await apiPOST<{ ok: true; client: ClientRow }>("/api/sales/clients", {
        name: s(cName),
        address: s(cAddress) || null,
        ownerName: s(cOwnerName) || null,
        careInstitutionNo: s(cCareNo) || null,
        bizRegNo: s(cBizNo) || null,

        receiverName: s(cRecvName) || null,
        receiverAddr: s(cRecvAddr) || null,
        receiverTel: s(cRecvTel) || null,
        receiverMobile: s(cRecvMobile) || null,
      });

      const created = r.client;

      if (bizFile) {
        await uploadBizFile(created.id, bizFile);
      }

      // reset
      setCName("");
      setCAddress("");
      setCOwnerName("");
      setCCareNo("");
      setCBizNo("");
      setCRecvName("");
      setCRecvAddr("");
      setCRecvTel("");
      setCRecvMobile("");
      setBizFile(null);

      await refreshBase();
      setTab("clients");
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_CREATE_CLIENT");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await apiPOST("/api/logout");
    } catch {
      // ignore
    } finally {
      window.location.href = "/";
    }
  }

  // styles
  const shell = "min-h-screen w-full px-4 py-10 md:py-14";
  const card =
    "mx-auto w-full max-w-[1200px] rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.55)]";
  const inner = "p-6 md:p-8";
  const btn =
    "h-[44px] px-4 rounded-2xl border border-white/14 bg-white/10 text-white font-extrabold hover:bg-white/15 active:bg-white/20";
  const btnPrimary =
    "h-[44px] px-5 rounded-2xl border border-white/12 bg-emerald-400/90 text-black font-extrabold hover:bg-emerald-300 active:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const input =
    "w-full h-[44px] px-4 rounded-2xl border border-white/12 bg-white/5 text-white font-extrabold outline-none placeholder:text-white/35";
  const label = "text-sm font-extrabold text-white/85";

  const tabBtn = (active: boolean) =>
    cls(
      "h-[40px] px-4 rounded-full border text-sm font-extrabold",
      active ? "bg-white text-black border-white" : "bg-white/10 text-white border-white/15 hover:bg-white/15"
    );

  const filteredClients = useMemo(() => {
    const qq = clientSearch.trim().toLowerCase();
    if (!qq) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(qq));
  }, [clients, clientSearch]);

  return (
    <div
      className={shell}
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
            <button className={btn} onClick={logout}>
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
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 font-extrabold">
              {errMsg}
            </div>
          ) : null}

          {/* 본문 */}
          {loadingBase ? (
            <div className="mt-6 text-white/70 font-bold">불러오는 중...</div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
              {/* ------------------- 주문요청 ------------------- */}
              {tab === "request" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-5">
                    <ComboBox
                      label="거래처 검색/선택"
                      placeholder="거래처를 선택하세요"
                      items={clients.map((c) => ({ id: c.id, name: c.name }))}
                      valueId={clientId}
                      onChangeId={(id) => {
                        setClientId(id);
                        setCart([]); // 실수 방지
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
                      placeholder="품목을 선택하세요"
                      items={items.map((x) => ({ id: x.id, name: x.name }))}
                      valueId={itemId}
                      onChangeId={setItemId}
                      search={itemSearch}
                      onChangeSearch={setItemSearch}
                    />

                    {/* 장바구니 */}
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-extrabold">장바구니</div>
                        <div className="text-white/60 text-sm font-extrabold">총 {cartTotal}개</div>
                      </div>

                      {cart.length === 0 ? (
                        <div className="mt-3 text-white/55 text-sm font-bold">담긴 품목이 없습니다.</div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {cart.map((x) => (
                            <div
                              key={x.itemId}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <div className="text-white font-extrabold truncate">{x.name}</div>
                                <div className="text-white/60 text-sm font-bold">수량: {x.quantity}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className={btn} onClick={() => decCart(x.itemId)}>
                                  -
                                </button>
                                <button className={btn} onClick={() => incCart(x.itemId)}>
                                  +
                                </button>
                                <button className={btn} onClick={() => removeFromCart(x.itemId)}>
                                  삭제
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-end">
                            <button className={btn} onClick={clearCart}>
                              장바구니 비우기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 배송정보 */}
                  <div className="space-y-4">
                    <div className="text-white font-extrabold">배송정보</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className={label}>수하인(필수)</div>
                        <input className={input} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <div className={label}>전화</div>
                        <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="예: 031-123-4567" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className={label}>주소(필수)</div>
                        <input className={input} value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <div className={label}>핸드폰</div>
                        <input className={input} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="예: 010-0000-0000" />
                      </div>
                      <div className="space-y-2">
                        <div className={label}>비고</div>
                        <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="요청사항" />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button className={btnPrimary} onClick={submitOrder} disabled={loading}>
                        {loading ? "주문요청 중..." : "주문요청"}
                      </button>
                    </div>

                    <div className="text-white/40 text-xs font-bold">
                      * 거래처/품목 선택 후 “담기” → 배송정보 입력 → “주문요청”
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------- 조회 ------------------- */}
              {tab === "list" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-2">
                      <div className={label}>기간 (한국시간 기준)</div>
                      <div className="flex items-center gap-2">
                        <input className={input} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                        <div className="text-white/60 font-extrabold">~</div>
                        <input className={input} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-[240px] space-y-2">
                      <div className={label}>검색</div>
                      <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색(품목/거래처/수하인/전화/주소/비고)" />
                    </div>

                    <button className={btn} onClick={refreshOrders} disabled={loadingOrders}>
                      {loadingOrders ? "조회중..." : "조회"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 overflow-auto">
                    <table className="min-w-[1100px] w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          {["등록일", "거래처", "품목(수량)", "상태", "수하인", "주소", "전화", "핸드폰", "비고"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-white/85 font-extrabold whitespace-nowrap border-b border-white/10">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-white/55 font-bold">
                              데이터가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((o: any) => (
                            <tr key={String(o?.id ?? Math.random())} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-4 py-3 text-white/85 font-bold whitespace-nowrap">
                                {String(o?.createdAt ?? "").replace("T", " ").slice(0, 19) || "-"}
                              </td>
                              <td className="px-4 py-3 text-white/90 font-extrabold whitespace-nowrap">
                                {o?.clientName || o?.client?.name || "-"}
                              </td>
                              <td className="px-4 py-3 text-white/85 font-bold">{orderItemsText(o)}</td>
                              <td className="px-4 py-3 text-white/85 font-extrabold whitespace-nowrap">{statusKo(o?.status)}</td>
                              <td className="px-4 py-3 text-white/85 font-bold whitespace-nowrap">{o?.receiverName ?? "-"}</td>
                              <td className="px-4 py-3 text-white/75 font-bold">{o?.receiverAddr ?? "-"}</td>
                              <td className="px-4 py-3 text-white/75 font-bold whitespace-nowrap">{o?.phone ?? "-"}</td>
                              <td className="px-4 py-3 text-white/75 font-bold whitespace-nowrap">{o?.mobile ?? "-"}</td>
                              <td className="px-4 py-3 text-white/75 font-bold">{o?.note ?? "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------- 거래처 목록 ------------------- */}
              {tab === "clients" && (
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <div className={label}>거래처 검색</div>
                      <input className={input} value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="거래처명을 입력하세요" />
                    </div>
                    <button className={btn} onClick={refreshBase}>
                      새로고침
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredClients.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="text-white font-extrabold text-lg">{c.name}</div>
                        <div className="mt-2 text-white/70 text-sm font-bold space-y-1">
                          <div>대표: {c.ownerName ?? "-"}</div>
                          <div>요양기관번호: {c.careInstitutionNo ?? "-"}</div>
                          <div>사업자번호: {c.bizRegNo ?? "-"}</div>
                          <div className="pt-2">거래처 주소: {c.address ?? "-"}</div>
                          <div>수하인: {c.receiverName ?? "-"}</div>
                          <div>배송지: {c.receiverAddr ?? "-"}</div>
                          <div>전화: {c.receiverTel ?? "-"}</div>
                          <div>휴대폰: {c.receiverMobile ?? "-"}</div>
                          <div className="pt-2">사업자등록증: {c.bizFileUrl ? "등록됨" : "-"}</div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 justify-end">
                          <button
                            className={btnPrimary}
                            onClick={() => {
                              setTab("request");
                              setClientId(c.id);
                              setClientSearch("");
                              setCart([]);
                            }}
                          >
                            주문요청에서 선택
                          </button>
                          {c.bizFileUrl ? (
                            <a className={btn} href={c.bizFileUrl} target="_blank" rel="noreferrer">
                              사업자등록증 보기
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------- 거래처 등록 ------------------- */}
              {tab === "clientsNew" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="text-white font-extrabold text-lg">거래처 기본정보</div>

                    <div className="space-y-2">
                      <div className={label}>거래처명(필수)</div>
                      <input className={input} value={cName} onChange={(e) => setCName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <div className={label}>거래처 주소</div>
                      <input className={input} value={cAddress} onChange={(e) => setCAddress(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className={label}>대표자명</div>
                        <input className={input} value={cOwnerName} onChange={(e) => setCOwnerName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <div className={label}>요양기관번호</div>
                        <input className={input} value={cCareNo} onChange={(e) => setCCareNo(e.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className={label}>사업자번호</div>
                        <input className={input} value={cBizNo} onChange={(e) => setCBizNo(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className={label}>사업자등록증 첨부</div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="block w-full text-white/80 font-bold"
                        onChange={(e) => setBizFile(e.target.files?.[0] || null)}
                      />
                      <div className="text-white/45 text-xs font-bold">* 등록 버튼을 누르면 거래처 저장 후 파일까지 업로드됩니다.</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-white font-extrabold text-lg">배송 기본값(자동채움용)</div>

                    <div className="space-y-2">
                      <div className={label}>수하인</div>
                      <input className={input} value={cRecvName} onChange={(e) => setCRecvName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <div className={label}>배송지 주소</div>
                      <input className={input} value={cRecvAddr} onChange={(e) => setCRecvAddr(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className={label}>전화</div>
                        <input className={input} value={cRecvTel} onChange={(e) => setCRecvTel(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <div className={label}>휴대폰</div>
                        <input className={input} value={cRecvMobile} onChange={(e) => setCRecvMobile(e.target.value)} />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button className={btnPrimary} onClick={createClient} disabled={loading}>
                        {loading ? "등록 중..." : "등록"}
                      </button>
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