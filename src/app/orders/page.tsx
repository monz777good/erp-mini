"use client";

import { useEffect, useMemo, useState } from "react";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

type Item = { id: string; name: string };
type Client = { id: string; name?: string; addr?: string; bizNo?: string; tel?: string; careNo?: string; ceoName?: string };
type CartRow = { itemId: string; name: string; quantity: number };

async function fetchJson(url: string) {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.message ? String(json.message) : `${res.status} ${res.statusText}`;
    throw new Error(`${msg}  (url: ${url})`);
  }
  return json;
}

export default function OrdersPage() {
  const [tab, setTab] = useState<"ORDER" | "QUERY" | "CLIENT">("ORDER");

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // ORDER
  const [clientKeyword, setClientKeyword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [itemKeyword, setItemKeyword] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [addQty, setAddQty] = useState<number>(1);
  const [cart, setCart] = useState<CartRow[]>([]);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");

  // QUERY
  const [queryClientId, setQueryClientId] = useState("");
  const [searchClientKeyword, setSearchClientKeyword] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

  // CLIENT REGISTER
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
    const kw = clientKeyword.trim().toLowerCase();
    if (!kw) return clients;
    return clients.filter((c) => {
      const s = `${c?.name ?? ""} ${c?.addr ?? ""} ${c?.bizNo ?? ""} ${c?.tel ?? ""}`.toLowerCase();
      return s.includes(kw);
    });
  }, [clients, clientKeyword]);

  const filteredItemsForOrder = useMemo(() => {
    const kw = itemKeyword.trim().toLowerCase();
    if (!kw) return items;
    return items.filter((it) => String(it?.name ?? "").toLowerCase().includes(kw));
  }, [items, itemKeyword]);

  const filteredClientsForSearch = useMemo(() => {
    const kw = searchClientKeyword.trim().toLowerCase();
    if (!kw) return clients;
    return clients.filter((c) => String(c?.name ?? "").toLowerCase().includes(kw));
  }, [clients, searchClientKeyword]);

  async function loadAll() {
    setError("");
    setOkMsg("");
    setLoadingBase(true);

    try {
      const itemsJson = await fetchJson("/api/items");
      const itemsList = Array.isArray(itemsJson) ? itemsJson : Array.isArray(itemsJson?.items) ? itemsJson.items : [];
      setItems(itemsList);

      const clientsJson = await fetchJson("/api/sales/clients");
      const clientsList = Array.isArray(clientsJson) ? clientsJson : Array.isArray(clientsJson?.clients) ? clientsJson.clients : [];
      setClients(clientsList);

      if (!queryClientId && clientsList?.[0]?.id) setQueryClientId(clientsList[0].id);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoadingBase(false);
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);
    setError("");
    setOkMsg("");
    try {
      const url = queryClientId ? `/api/sales/orders?clientId=${encodeURIComponent(queryClientId)}` : "/api/sales/orders";
      const json = await fetchJson(url);
      setOrders(Array.isArray(json?.orders) ? json.orders : Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 거래처 선택 시 배송정보 자동
  useEffect(() => {
    const c = clients.find((x) => x.id === selectedClientId);
    if (!c) return;

    setReceiverName(c.name ?? "");
    setReceiverAddr(c.addr ?? "");

    const telDigits = digitsOnly(c.tel ?? "");
    if (telDigits.length === 10 || telDigits.length === 11) setMobile(telDigits);
    else if (c.tel) setPhone(c.tel);
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
      if (!(mob.length === 10 || mob.length === 11)) throw new Error("핸드폰(숫자만) 필요");

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverName: receiverName.trim(),
          receiverAddr: receiverAddr.trim(),
          receiverPhone: digitsOnly(phone),
          receiverMobile: mob,
          note: note.trim(),
          cart,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? `${res.status} ${res.statusText}`);

      setOkMsg("주문요청 완료");
      setCart([]);
      setNote("");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function createClient() {
    setSaving(true);
    setError("");
    setOkMsg("");

    try {
      if (!newClientName.trim()) throw new Error("거래처명을 입력하세요.");

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
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? `${res.status} ${res.statusText}`);

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
            <div className="card-soft">불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg">
      <div className="app-inner">
        <div className="page-wrap">
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

          {error ? <div className="msg err">{error}</div> : null}
          {okMsg ? <div className="msg ok">{okMsg}</div> : null}

          <div className="card-soft">
            {tab === "ORDER" && (
              <>
                <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 14 }}>주문요청</div>

                <div className="form-grid">
                  <div className="label">거래처 검색</div>
                  <input className="input" placeholder="거래처 검색 (이름/주소/사업자번호/전화)" value={clientKeyword} onChange={(e) => setClientKeyword(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">거래처(선택)</div>
                  <select className="select" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                    <option value="">(선택안함)</option>
                    {filteredClientsForOrder.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="label">품목 검색</div>
                  <input className="input" placeholder="품목 검색" value={itemKeyword} onChange={(e) => setItemKeyword(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">품목</div>
                  <select className="select" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                    <option value="">(선택)</option>
                    {filteredItemsForOrder.map((it) => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="label">수량</div>
                  <input className="input" value={addQty} onChange={(e) => setAddQty(Number(e.target.value) || 1)} inputMode="numeric" />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button className="btn" onClick={addToCart}>장바구니 담기</button>
                </div>

                <div className="hr" />

                <div style={{ fontSize: 20, fontWeight: 950, marginBottom: 10 }}>장바구니</div>
                {cart.length === 0 ? (
                  <div style={{ fontWeight: 800, color: "rgba(0,0,0,.6)" }}>장바구니가 비었습니다.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {cart.map((r) => (
                      <div key={r.itemId} style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px", gap: 10, alignItems: "center" }}>
                        <div style={{ fontWeight: 950 }}>{r.name}</div>
                        <input className="input" value={r.quantity} onChange={(e) => changeCartQty(r.itemId, Number(e.target.value) || 1)} inputMode="numeric" />
                        <button className="btn" onClick={() => removeCart(r.itemId)}>삭제</button>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button className="btn" onClick={clearCart}>비우기</button>
                    </div>
                  </div>
                )}

                <div className="hr" />

                <div style={{ fontSize: 20, fontWeight: 950, marginBottom: 10 }}>배송정보</div>

                <div className="form-grid">
                  <div className="label">수하인</div>
                  <input className="input" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">주소</div>
                  <input className="input" value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">전화(선택)</div>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">핸드폰(필수)</div>
                  <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">배송메모</div>
                  <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button className="btn btn-primary" disabled={saving} onClick={submitCartOrder}>
                    {saving ? "전송 중..." : "주문요청"}
                  </button>
                </div>
              </>
            )}

            {tab === "QUERY" && (
              <>
                <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 14 }}>주문 조회</div>

                <div className="form-grid">
                  <div className="label">거래처 검색</div>
                  <input className="input" placeholder="거래처명 검색" value={searchClientKeyword} onChange={(e) => setSearchClientKeyword(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">거래처 선택</div>
                  <select className="select" value={queryClientId} onChange={(e) => setQueryClientId(e.target.value)}>
                    <option value="">(전체)</option>
                    {filteredClientsForSearch.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 12 }}>
                  <button className="btn" onClick={loadOrders} disabled={loadingOrders}>
                    {loadingOrders ? "불러오는 중..." : "조회"}
                  </button>
                </div>

                <div style={{ fontWeight: 900, color: "rgba(0,0,0,.7)" }}>
                  {orders.length === 0 ? "표시할 주문이 없습니다." : `총 ${orders.length}건`}
                </div>
              </>
            )}

            {tab === "CLIENT" && (
              <>
                <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 14 }}>거래처 등록</div>

                <div className="form-grid">
                  <div className="label">거래처명</div>
                  <input className="input" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">대표자명</div>
                  <input className="input" value={newClientCeoName} onChange={(e) => setNewClientCeoName(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">사업자번호</div>
                  <input className="input" value={newClientBizNo} onChange={(e) => setNewClientBizNo(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">주소</div>
                  <input className="input" value={newClientAddr} onChange={(e) => setNewClientAddr(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">전화</div>
                  <input className="input" value={newClientTel} onChange={(e) => setNewClientTel(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">요양기관번호</div>
                  <input className="input" value={newClientCareNo} onChange={(e) => setNewClientCareNo(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">이메일</div>
                  <input className="input" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">비고</div>
                  <textarea className="textarea" value={newClientRemark} onChange={(e) => setNewClientRemark(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="label">사업자등록증</div>
                  <input className="input" type="file" onChange={(e) => setBizFile(e.target.files?.[0] ?? null)} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" disabled={saving} onClick={createClient}>
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