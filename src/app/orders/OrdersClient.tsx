"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "request" | "list" | "clients" | "clientsNew";

type ClientRow = {
  id: string;
  name: string;
  receiverName?: string | null;
  receiverAddr?: string | null;
  phone?: string | null;
  mobile?: string | null;
  createdAt?: string;
};

type ItemRow = {
  id: string;
  name: string;
};

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

  client?: { id: string; name: string } | null;
  item?: { id: string; name: string } | null;
};

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

export default function OrdersClient() {
  const [tab, setTab] = useState<TabKey>("request");

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 검색
  const [clientSearch, setClientSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  // 주문 폼
  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");

  // 거래처 등록 폼
  const [newClientName, setNewClientName] = useState("");
  const [newClientReceiverName, setNewClientReceiverName] = useState("");
  const [newClientReceiverAddr, setNewClientReceiverAddr] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientMobile, setNewClientMobile] = useState("");

  // 조회 기간
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => (i.name || "").toLowerCase().includes(q));
  }, [items, itemSearch]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) || null,
    [clients, clientId]
  );

  // ✅ 거래처 선택 시 자동 채움 (완전판: 수하인/주소/전화/휴대폰)
  useEffect(() => {
    if (!selectedClient) return;
    setReceiverName(selectedClient.receiverName ?? "");
    setReceiverAddr(selectedClient.receiverAddr ?? "");
    setPhone(selectedClient.phone ?? "");
    setMobile(selectedClient.mobile ?? "");
  }, [selectedClient?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        fromDate && toDate
          ? `?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`
          : "";
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

    // 기본 7일
    const now = new Date();
    const to = new Date(now);
    const from = new Date(now);
    from.setDate(now.getDate() - 7);

    const f = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(
      from.getDate()
    ).padStart(2, "0")}`;
    const t = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(
      to.getDate()
    ).padStart(2, "0")}`;
    setFromDate(f);
    setToDate(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitOrder() {
    setErrMsg(null);
    try {
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
        name: newClientName,
        receiverName: newClientReceiverName,
        receiverAddr: newClientReceiverAddr,
        phone: newClientPhone,
        mobile: newClientMobile,
      });

      setClients((prev) => [r.client, ...prev]);

      setClientId(r.client.id);
      setTab("request");

      setReceiverName(r.client.receiverName ?? "");
      setReceiverAddr(r.client.receiverAddr ?? "");
      setPhone(r.client.phone ?? "");
      setMobile(r.client.mobile ?? "");

      setNewClientName("");
      setNewClientReceiverName("");
      setNewClientReceiverAddr("");
      setNewClientPhone("");
      setNewClientMobile("");
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_CREATE_CLIENT");
    }
  }

  const shell = "min-h-[100svh] w-full px-4 py-6";
  const card =
    "w-full max-w-5xl mx-auto rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]";
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
      active
        ? "bg-white text-black border-white"
        : "bg-white/10 text-white border-white/15 hover:bg-white/15"
    );

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
          <div className="text-2xl font-extrabold text-white">주문</div>
          <div className="text-white/60 text-sm mt-1">거래처/품목 선택 + 배송정보 입력 후 주문요청</div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className={tabBtn(tab === "request")} onClick={() => setTab("request")}>주문요청</button>
            <button
              className={tabBtn(tab === "list")}
              onClick={async () => {
                setTab("list");
                await refreshOrders();
              }}
            >
              조회
            </button>
            <button className={tabBtn(tab === "clients")} onClick={() => setTab("clients")}>거래처 목록</button>
            <button className={tabBtn(tab === "clientsNew")} onClick={() => setTab("clientsNew")}>거래처 등록</button>
          </div>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
              {errMsg}
            </div>
          ) : null}

          {loadingBase ? (
            <div className="mt-6 text-white/70">불러오는 중...</div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
              {tab === "request" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className={label}>거래처 검색</div>
                    <input className={input} placeholder="거래처명을 입력하세요" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />

                    <div className="mt-3">
                      <div className={label}>거래처 선택</div>
                      <select className={input} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                        <option value="">거래처를 선택하세요</option>
                        {filteredClients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>

                      {clients.length === 0 ? (
                        <button className={cls(btn, "mt-3 w-full")} onClick={() => setTab("clientsNew")}>
                          거래처가 없습니다 → 거래처 등록하러 가기
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-5">
                      <div className={label}>수량</div>
                      <div className="flex items-center gap-3">
                        <button className={btn} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                        <input
                          className={input}
                          style={{ width: 120, textAlign: "center" as const }}
                          value={String(quantity)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!Number.isFinite(n)) return;
                            setQuantity(Math.max(1, Math.floor(n)));
                          }}
                        />
                        <button className={btn} onClick={() => setQuantity((q) => q + 1)}>+</button>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className={label}>품목 검색</div>
                      <input className={input} placeholder="품목명을 입력하세요" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
                      <div className="mt-3">
                        <div className={label}>품목 선택</div>
                        <select className={input} value={itemId} onChange={(e) => setItemId(e.target.value)}>
                          <option value="">품목을 선택하세요</option>
                          {filteredItems.map((i) => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </div>
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

                    <div className="mt-5 flex gap-3">
                      <button className={btnPrimary} onClick={submitOrder} disabled={!clientId || !itemId}>
                        주문 요청
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
                        }}
                      >
                        초기화
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === "clientsNew" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={panel}>
                    <div className="text-white font-bold">거래처 등록</div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className={label}>거래처명 (필수)</div>
                        <input className={input} value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className={label}>수하인</div>
                          <input className={input} value={newClientReceiverName} onChange={(e) => setNewClientReceiverName(e.target.value)} />
                        </div>
                        <div>
                          <div className={label}>주소</div>
                          <input className={input} value={newClientReceiverAddr} onChange={(e) => setNewClientReceiverAddr(e.target.value)} />
                        </div>
                        <div>
                          <div className={label}>전화</div>
                          <input className={input} value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
                        </div>
                        <div>
                          <div className={label}>휴대폰</div>
                          <input className={input} value={newClientMobile} onChange={(e) => setNewClientMobile(e.target.value)} />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button className={btnPrimary} onClick={createClient} disabled={!newClientName.trim()}>
                          거래처 등록
                        </button>
                        <button
                          className={btn}
                          onClick={() => {
                            setNewClientName("");
                            setNewClientReceiverName("");
                            setNewClientReceiverAddr("");
                            setNewClientPhone("");
                            setNewClientMobile("");
                          }}
                        >
                          초기화
                        </button>
                        <button className={btn} onClick={() => setTab("clients")}>거래처 목록 보기</button>
                      </div>
                    </div>
                  </div>

                  <div className={panel}>
                    <div className="text-white font-bold">안내</div>
                    <ul className="mt-3 text-white/70 text-sm space-y-2 list-disc pl-5">
                      <li>등록 즉시 주문요청 선택창/거래처 목록에 반영됩니다.</li>
                      <li>거래처 선택 시 수하인/주소/연락처 자동 채움됩니다.</li>
                      <li>거래처/품목이 많으면 검색창으로 바로 찾으세요.</li>
                    </ul>
                  </div>
                </div>
              )}

              {tab === "clients" && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-5">
                    <div className="flex-1">
                      <div className={label}>거래처 검색</div>
                      <input className={input} value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <button className={btn} onClick={refreshBase}>새로고침</button>
                      <button className={btnPrimary} onClick={() => setTab("clientsNew")}>거래처 등록</button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredClients.map((c) => (
                      <div key={c.id} className={panel}>
                        <div className="text-white font-bold">{c.name}</div>
                        <div className="mt-3 text-white/75 text-sm space-y-1">
                          <div>수하인: {c.receiverName || "-"}</div>
                          <div>주소: {c.receiverAddr || "-"}</div>
                          <div>전화: {c.phone || "-"}</div>
                          <div>휴대폰: {c.mobile || "-"}</div>
                        </div>
                        <div className="mt-4">
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
                      </div>
                    ))}
                    {filteredClients.length === 0 ? <div className="text-white/70">검색 결과가 없습니다.</div> : null}
                  </div>
                </div>
              )}

              {tab === "list" && (
                <div>
                  <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-5">
                    <div className="flex gap-3 flex-wrap">
                      <div>
                        <div className={label}>시작일</div>
                        <input type="date" className={input} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      </div>
                      <div>
                        <div className={label}>종료일</div>
                        <input type="date" className={input} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className={btnPrimary} onClick={refreshOrders}>기간 조회</button>
                      <button className={btn} onClick={() => { setFromDate(""); setToDate(""); }}>기간 초기화</button>
                    </div>
                  </div>

                  <div className="mt-5">
                    {loadingOrders ? (
                      <div className="text-white/70">조회 중...</div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-12 bg-white/10 px-4 py-3 text-white/80 text-sm font-semibold">
                          <div className="col-span-2">날짜</div>
                          <div className="col-span-2">상태</div>
                          <div className="col-span-2">거래처</div>
                          <div className="col-span-2">품목</div>
                          <div className="col-span-1 text-right">수량</div>
                          <div className="col-span-3">배송</div>
                        </div>

                        {orders.length === 0 ? (
                          <div className="px-4 py-6 text-white/70">조회 결과가 없습니다.</div>
                        ) : (
                          orders.map((o) => (
                            <div key={o.id} className="grid grid-cols-12 px-4 py-3 border-t border-white/10 text-white/90 text-sm">
                              <div className="col-span-2">{new Date(o.createdAt).toLocaleDateString()}</div>
                              <div className="col-span-2">{o.status}</div>
                              <div className="col-span-2">{o.client?.name || "-"}</div>
                              <div className="col-span-2">{o.item?.name || "-"}</div>
                              <div className="col-span-1 text-right">{o.quantity}</div>
                              <div className="col-span-3 text-white/75">
                                <div className="truncate">{o.receiverName}</div>
                                <div className="truncate">{o.receiverAddr}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
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