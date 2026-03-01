"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; name: string };
type Client = {
  id: string;
  name: string;
  ceoName?: string | null;
  bizNo?: string | null;
  addr?: string | null;
  tel?: string | null;
  careNo?: string | null;
  email?: string | null;
  remark?: string | null;
};

type OrderRow = {
  id: string;
  createdAt: string;
  status: string;
  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;
  message?: string | null;
  items: { name: string; quantity: number }[];
};

type CartRow = { itemId: string; name: string; quantity: number };

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function OrdersPage() {
  const [tab, setTab] = useState<"ORDER" | "QUERY" | "CLIENT">("ORDER");

  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // 주문 탭
  const [clientKeyword, setClientKeyword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [itemKeyword, setItemKeyword] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [addQty, setAddQty] = useState(1);

  const [cart, setCart] = useState<CartRow[]>([]);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [mobile, setMobile] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // 조회 탭
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [queryClientId, setQueryClientId] = useState("");

  // 거래처 등록 탭
  const [newClientName, setNewClientName] = useState("");
  const [newClientCeoName, setNewClientCeoName] = useState("");
  const [newClientBizNo, setNewClientBizNo] = useState("");
  const [newClientAddr, setNewClientAddr] = useState("");
  const [newClientTel, setNewClientTel] = useState("");
  const [newClientCareNo, setNewClientCareNo] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientRemark, setNewClientRemark] = useState("");
  const [bizFile, setBizFile] = useState<File | null>(null);

  const careNoDigits = useMemo(() => digitsOnly(newClientCareNo), [newClientCareNo]);

  const filteredClientsForOrder = useMemo(() => {
    const kw = clientKeyword.trim();
    if (!kw) return clients;
    return clients.filter((c) => {
      const t = `${c.name ?? ""} ${c.addr ?? ""} ${c.bizNo ?? ""} ${c.tel ?? ""}`;
      return t.includes(kw);
    });
  }, [clients, clientKeyword]);

  const filteredItemsForOrder = useMemo(() => {
    const kw = itemKeyword.trim();
    if (!kw) return items;
    return items.filter((it) => (it.name ?? "").includes(kw));
  }, [items, itemKeyword]);

  async function loadAll() {
    setLoadingBase(true);
    setError("");
    setOkMsg("");

    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/sales/clients", { credentials: "include", cache: "no-store" }),
        fetch("/api/items", { credentials: "include", cache: "no-store" }),
      ]);

      const j1 = await r1.json().catch(() => null);
      const j2 = await r2.json().catch(() => null);

      if (!r1.ok || !j1?.ok) throw new Error(j1?.message ?? "LOAD_CLIENTS_FAILED");
      if (!r2.ok) throw new Error(j2?.message ?? "LOAD_ITEMS_FAILED");

      const clientsList: Client[] = Array.isArray(j1?.clients) ? j1.clients : [];
      const itemsList: Item[] = Array.isArray(j2) ? j2 : Array.isArray(j2?.items) ? j2.items : [];

      setClients(clientsList);
      setItems(itemsList);

      if (!queryClientId && clientsList[0]?.id) setQueryClientId(clientsList[0].id);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoadingBase(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 거래처 선택하면 배송정보 자동 세팅
  useEffect(() => {
    const c = clients.find((x) => x.id === selectedClientId);
    if (!c) return;

    setReceiverName(c.name ?? "");
    setReceiverAddr(c.addr ?? "");

    const telDigits = digitsOnly(c.tel ?? "");
    if (telDigits.length === 10 || telDigits.length === 11) {
      setMobile(telDigits);
    } else if (c.tel) {
      setPhone(c.tel);
    }
  }, [selectedClientId, clients]);

  function addToCart() {
    setError("");
    setOkMsg("");

    const it = items.find((x) => x.id === selectedItemId);
    if (!it) return setError("품목을 선택하세요.");

    const qty = Math.max(1, Number(addQty) || 1);

    setCart((prev) => {
      const idx = prev.findIndex((r) => r.itemId === it.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { itemId: it.id, name: it.name, quantity: qty }];
    });

    setOkMsg("장바구니 담김");
  }

  function changeCartQty(itemId: string, qty: number) {
    setCart((prev) => prev.map((r) => (r.itemId === itemId ? { ...r, quantity: Math.max(1, Number(qty) || 1) } : r)));
  }

  function removeCart(itemId: string) {
    setCart((prev) => prev.filter((r) => r.itemId !== itemId));
  }

  function clearCart() {
    setCart([]);
  }

  async function submitCartOrder() {
    setSaving(true);
    setError("");
    setOkMsg("");

    try {
      if (cart.length === 0) throw new Error("장바구니가 비었습니다.");
      if (!receiverName.trim()) throw new Error("수하인을 입력하세요.");
      if (!receiverAddr.trim()) throw new Error("주소를 입력하세요.");

      const mob = digitsOnly(mobile);
      if (!(mob.length === 10 || mob.length === 11)) throw new Error("핸드폰번호(숫자 10~11자리)가 필요합니다.");

      const payload = {
        clientId: selectedClientId || null,
        receiverName: receiverName.trim(),
        receiverAddr: receiverAddr.trim(),
        mobile: mob,
        phone: digitsOnly(phone) || null,
        message: message.trim() || null,
        items: cart.map((r) => ({ itemId: r.itemId, quantity: r.quantity })),
      };

      let res = await fetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // 혹시 예전 경로 fallback
      if (res.status === 404) {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "ORDER_FAILED");

      setOkMsg(`주문요청 완료 (${json?.count ?? cart.length}건)`);
      clearCart();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);
    setError("");
    setOkMsg("");

    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      if (queryClientId) qs.set("clientId", queryClientId);

      const res = await fetch(`/api/sales/orders?${qs.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "LOAD_ORDERS_FAILED");

      setOrders(Array.isArray(json?.orders) ? json.orders : []);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function createClient() {
    setSaving(true);
    setError("");
    setOkMsg("");

    try {
      if (!newClientName.trim()) throw new Error("거래처명을 입력하세요.");
      if (newClientCareNo.trim() && careNoDigits.length !== 8) {
        throw new Error("요양기관번호는 숫자만 8자리로 입력하세요.");
      }

      const fd = new FormData();
      fd.append("name", newClientName.trim());
      fd.append("ceoName", newClientCeoName.trim());
      fd.append("bizNo", newClientBizNo.trim());
      fd.append("addr", newClientAddr.trim());
      fd.append("tel", newClientTel.trim());
      fd.append("careNo", careNoDigits);
      fd.append("email", newClientEmail.trim());
      fd.append("remark", newClientRemark.trim());
      if (bizFile) fd.append("bizCert", bizFile);

      const res = await fetch("/api/sales/clients", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "CLIENT_CREATE_FAILED");

      setOkMsg("거래처 등록 완료");
      setNewClientName("");
      setNewClientCeoName("");
      setNewClientBizNo("");
      setNewClientAddr("");
      setNewClientTel("");
      setNewClientCareNo("");
      setNewClientEmail("");
      setNewClientRemark("");
      setBizFile(null);

      await loadAll();
      setTab("ORDER");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  if (loadingBase) {
    return (
      <div className="app-bg">
        <div className="app-inner">
          <div className="page-wrap">
            <div className="erp-card">불러오는 중…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg">
      <div className="app-inner">
        <div className="page-wrap">
          {/* ✅ 상단바: 좌측 브랜드 / 탭 / 우측 로그아웃 */}
          <div className="topbar">
            <div className="brand">한의N원외탕전 ERP</div>

            <div className="tabs">
              <button className={`tab ${tab === "ORDER" ? "on" : ""}`} onClick={() => setTab("ORDER")}>
                주문
              </button>
              <button className={`tab ${tab === "QUERY" ? "on" : ""}`} onClick={() => setTab("QUERY")}>
                조회
              </button>
              <button className={`tab ${tab === "CLIENT" ? "on" : ""}`} onClick={() => setTab("CLIENT")}>
                거래처 등록
              </button>
            </div>

            <div className="right-actions">
              <button className="btn" onClick={loadAll}>새로고침</button>
              <a className="btn" href="/api/logout">로그아웃</a>
            </div>
          </div>

          {error ? (
            <div className="erp-card" style={{ borderColor: "crimson", color: "crimson", fontWeight: 900, marginBottom: 14 }}>
              {error}
            </div>
          ) : null}

          {okMsg ? (
            <div className="erp-card" style={{ borderColor: "rgba(0,160,60,.35)", color: "#0a6b2a", fontWeight: 900, marginBottom: 14 }}>
              {okMsg}
            </div>
          ) : null}

          {/* ✅ 내용은 무조건 흰 카드 안 */}
          <div className="erp-card">
            {tab === "ORDER" && (
              <>
                <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 14 }}>주문요청</div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>거래처 검색</div>
                  <input className="input" placeholder="거래처 검색 (이름/주소/사업자번호/전화)" value={clientKeyword} onChange={(e) => setClientKeyword(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>거래처(선택)</div>
                  <select className="select" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                    <option value="">(선택안함)</option>
                    {filteredClientsForOrder.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>품목 검색</div>
                  <input className="input" placeholder="품목 검색" value={itemKeyword} onChange={(e) => setItemKeyword(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>품목</div>
                  <select className="select" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                    <option value="">(선택)</option>
                    {filteredItemsForOrder.map((it) => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>수량</div>
                  <input className="input" value={addQty} onChange={(e) => setAddQty(Number(e.target.value) || 1)} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button className="btn" onClick={addToCart}>장바구니 담기</button>
                </div>

                <div className="hr" />

                <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>장바구니 (여러 품목 한번에)</div>
                {cart.length === 0 ? (
                  <div style={{ color: "rgba(0,0,0,.65)", fontWeight: 800 }}>장바구니가 비었습니다.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {cart.map((r) => (
                      <div key={r.itemId} style={{ display: "grid", gridTemplateColumns: "1fr 120px 90px", gap: 10, alignItems: "center" }}>
                        <div style={{ fontWeight: 900 }}>{r.name}</div>
                        <input className="input" value={r.quantity} onChange={(e) => changeCartQty(r.itemId, Number(e.target.value) || 1)} />
                        <button className="btn" onClick={() => removeCart(r.itemId)}>삭제</button>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button className="btn" onClick={clearCart}>비우기</button>
                    </div>
                  </div>
                )}

                <div className="hr" />

                <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>배송정보</div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>수하인</div>
                  <input className="input" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>주소</div>
                  <input className="input" value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>핸드폰(필수)</div>
                  <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>전화(선택)</div>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>배송메세지</div>
                  <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn"
                    disabled={saving}
                    onClick={submitCartOrder}
                    style={{ background: "rgba(0,0,0,.85)", color: "white", border: "none" }}
                  >
                    {saving ? "처리 중..." : "주문요청 제출"}
                  </button>
                </div>
              </>
            )}

            {tab === "QUERY" && (
              <>
                <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 14 }}>주문조회</div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>기간</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input className="input" style={{ width: 200 }} value={from} onChange={(e) => setFrom(e.target.value)} />
                    <div style={{ fontWeight: 900, alignSelf: "center" }}>~</div>
                    <input className="input" style={{ width: 200 }} value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>거래처</div>
                  <select className="select" value={queryClientId} onChange={(e) => setQueryClientId(e.target.value)}>
                    <option value="">(전체)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button className="btn" onClick={loadOrders} disabled={loadingOrders}>
                    {loadingOrders ? "불러오는 중..." : "조회"}
                  </button>
                </div>

                <div className="hr" />

                {orders.length === 0 ? (
                  <div style={{ color: "rgba(0,0,0,.65)", fontWeight: 800 }}>표시할 주문이 없습니다.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {orders.map((o) => (
                      <div key={o.id} style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(0,0,0,.10)", background: "rgba(255,255,255,.75)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 950 }}>
                            {o.receiverName} / {o.status}
                          </div>
                          <div style={{ fontWeight: 900, color: "rgba(0,0,0,.65)" }}>
                            {String(o.createdAt).slice(0, 10)}
                          </div>
                        </div>
                        <div style={{ marginTop: 8, fontWeight: 800, color: "rgba(0,0,0,.75)" }}>
                          {o.receiverAddr}
                        </div>
                        <div style={{ marginTop: 10 }}>
                          {o.items?.map((it, idx) => (
                            <div key={idx} style={{ fontWeight: 900 }}>
                              - {it.name} x {it.quantity}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "CLIENT" && (
              <>
                <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 14 }}>거래처 등록</div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>거래처명</div>
                  <input className="input" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>대표자명</div>
                  <input className="input" value={newClientCeoName} onChange={(e) => setNewClientCeoName(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>사업자번호</div>
                  <input className="input" value={newClientBizNo} onChange={(e) => setNewClientBizNo(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>주소</div>
                  <input className="input" value={newClientAddr} onChange={(e) => setNewClientAddr(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>전화</div>
                  <input className="input" value={newClientTel} onChange={(e) => setNewClientTel(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>요양기관번호</div>
                  <input className="input" placeholder="숫자 8자리(선택)" value={newClientCareNo} onChange={(e) => setNewClientCareNo(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>이메일</div>
                  <input className="input" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>비고</div>
                  <textarea className="textarea" value={newClientRemark} onChange={(e) => setNewClientRemark(e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 900 }}>사업자등록증</div>
                  <input
                    className="input"
                    type="file"
                    onChange={(e) => setBizFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn"
                    disabled={saving}
                    onClick={createClient}
                    style={{ background: "rgba(0,0,0,.85)", color: "white", border: "none" }}
                  >
                    {saving ? "등록 중..." : "거래처 등록"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}