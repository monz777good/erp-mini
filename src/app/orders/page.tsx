"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "ORDER" | "QUERY" | "CLIENT";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function statusKo(s: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "REQUESTED") return "대기";
  if (v === "APPROVED") return "승인";
  if (v === "REJECTED") return "거절";
  if (v === "DONE") return "출고완료";
  if (v === "SHIPPED") return "출고완료";
  return v || "-";
}

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("ORDER");

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // ORDER: 선택/검색
  const [clientKeyword, setClientKeyword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  const [itemKeyword, setItemKeyword] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [addQty, setAddQty] = useState<number>(1);

  // 배송정보
  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [mobile, setMobile] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // 장바구니
  const [cart, setCart] = useState<{ itemId: string; name: string; quantity: number }[]>([]);

  // QUERY
  const [searchClientKeyword, setSearchClientKeyword] = useState("");
  const [queryClientId, setQueryClientId] = useState("");

  // CLIENT create
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
    try {
      setLoadingBase(true);

      // ✅ items
      const itemsRes = await fetch("/api/items", { credentials: "include" });
      const itemsJson = await itemsRes.json().catch(() => null);
      const itemsList = Array.isArray(itemsJson) ? itemsJson : Array.isArray(itemsJson?.items) ? itemsJson.items : [];
      setItems(itemsList);

      // ✅ clients (영업사원 전용)
      const clientsRes = await fetch("/api/sales/clients", { credentials: "include" });
      const clientsJson = await clientsRes.json().catch(() => null);
      const clientsList = Array.isArray(clientsJson) ? clientsJson : Array.isArray(clientsJson?.clients) ? clientsJson.clients : [];
      setClients(clientsList);

      if (!queryClientId && clientsList?.[0]?.id) setQueryClientId(clientsList[0].id);
    } catch {
      setError("데이터 불러오기 실패");
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
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? "LOAD_ORDERS_FAILED");
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

  async function createClient() {
    setSaving(true);
    setError("");
    setOkMsg("");

    try {
      if (!newClientName.trim()) throw new Error("거래처명을 입력하세요.");
      if (newClientCareNo.trim() && careNoDigits.length !== 8) throw new Error("요양기관번호는 숫자만 8자리로 입력하세요.");

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
      <div className="page-bg">
        <div className="page-wrap">
          <div className="glass-card">불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <div className="page-wrap">
        <div className="page-topbar">
          <div className="page-brand">한의N원외탕전 ERP</div>
          <div style={{ display: "flex", gap: 10 }}>
            <a className="btn" href="/api/logout">
              로그아웃
            </a>
          </div>
        </div>

        {error ? <div className="msg err">{error}</div> : null}
        {okMsg ? <div className="msg ok">{okMsg}</div> : null}

        <div className="tabs">
          <button className={`tab-btn ${tab === "ORDER" ? "on" : ""}`} onClick={() => setTab("ORDER")}>
            주문
          </button>
          <button className={`tab-btn ${tab === "QUERY" ? "on" : ""}`} onClick={() => setTab("QUERY")}>
            조회
          </button>
          <button className={`tab-btn ${tab === "CLIENT" ? "on" : ""}`} onClick={() => setTab("CLIENT")}>
            거래처 등록
          </button>

          <div style={{ flex: 1 }} />
          <button className="btn" onClick={loadAll}>
            새로고침
          </button>
        </div>

        {/* ✅ 겉카드 딱 1개 (탭 내용도 이 카드 안에서만 바뀜) */}
        <div className="glass-card">
          <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 14 }}>영업사원 주문</div>

          {tab === "ORDER" && (
            <>
              <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 14 }}>주문요청</div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>거래처 검색</div>
                <input
                  className="input"
                  placeholder="거래처 검색 (이름/주소/사업자번호/전화)"
                  value={clientKeyword}
                  onChange={(e) => setClientKeyword(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>거래처(선택)</div>
                <select className="select" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                  <option value="">(선택안함)</option>
                  {filteredClientsForOrder.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>품목 검색</div>
                <input className="input" placeholder="품목 검색" value={itemKeyword} onChange={(e) => setItemKeyword(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>품목</div>
                <select className="select" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                  <option value="">(선택)</option>
                  {filteredItemsForOrder.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>수량</div>
                <input className="input" value={addQty} onChange={(e) => setAddQty(Number(e.target.value) || 1)} inputMode="numeric" />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
                <button className="btn" onClick={addToCart}>
                  장바구니 담기
                </button>
              </div>

              <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>장바구니 (여러 품목 한번에)</div>

              {cart.length === 0 ? (
                <div style={{ color: "rgba(0,0,0,.6)", fontWeight: 800, marginBottom: 16 }}>장바구니가 비었습니다.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {cart.map((r) => (
                    <div
                      key={r.itemId}
                      style={{
                        border: "1px solid rgba(0,0,0,.08)",
                        borderRadius: 16,
                        padding: 12,
                        background: "rgba(255,255,255,.85)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 950 }}>{r.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            className="input"
                            style={{ width: 110 }}
                            value={r.quantity}
                            onChange={(e) => changeCartQty(r.itemId, Number(e.target.value) || 1)}
                            inputMode="numeric"
                          />
                          <button className="btn" onClick={() => removeCart(r.itemId)}>
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn" onClick={clearCart}>
                      장바구니 비우기
                    </button>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>배송정보</div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>수하인</div>
                <input className="input" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>주소</div>
                <input className="input" value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>핸드폰(숫자만)</div>
                <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>전화(선택)</div>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>배송메세지</div>
                <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                <button className="btn dark" disabled={saving || cart.length === 0} onClick={submitCartOrder}>
                  {saving ? "저장 중..." : "주문요청 제출"}
                </button>
              </div>
            </>
          )}

          {tab === "QUERY" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>조회</div>
                <button className="btn" onClick={loadOrders} disabled={loadingOrders}>
                  {loadingOrders ? "불러오는중" : "조회"}
                </button>
              </div>

              <div style={{ height: 14 }} />

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>거래처 검색</div>
                <input className="input" placeholder="거래처 검색" value={searchClientKeyword} onChange={(e) => setSearchClientKeyword(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>거래처(필터)</div>
                <select className="select" value={queryClientId} onChange={(e) => setQueryClientId(e.target.value)}>
                  <option value="">(전체)</option>
                  {filteredClientsForSearch.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 14 }}>
                {orders.length === 0 ? (
                  <div style={{ color: "rgba(0,0,0,.6)", fontWeight: 800 }}>조회 결과 없음</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {orders.map((o: any) => (
                      <div
                        key={o.id}
                        style={{
                          border: "1px solid rgba(0,0,0,.08)",
                          borderRadius: 16,
                          padding: 12,
                          background: "rgba(255,255,255,.85)",
                        }}
                      >
                        <div style={{ fontWeight: 950 }}>
                          {o?.item?.name ?? "-"} / 수량 {o.quantity} / {statusKo(o.status)}
                        </div>
                        <div style={{ color: "rgba(0,0,0,.65)", fontWeight: 800, marginTop: 6 }}>
                          {o.receiverName} / {o.receiverAddr}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "CLIENT" && (
            <>
              <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 14 }}>거래처 등록</div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>거래처명</div>
                <input className="input" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>대표자명</div>
                <input className="input" value={newClientCeoName} onChange={(e) => setNewClientCeoName(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>사업자번호</div>
                <input className="input" value={newClientBizNo} onChange={(e) => setNewClientBizNo(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>주소</div>
                <input className="input" value={newClientAddr} onChange={(e) => setNewClientAddr(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>전화</div>
                <input className="input" value={newClientTel} onChange={(e) => setNewClientTel(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>요양기관번호</div>
                <input className="input" placeholder="숫자만 8자리" value={newClientCareNo} onChange={(e) => setNewClientCareNo(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>이메일</div>
                <input className="input" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>비고</div>
                <textarea className="textarea" value={newClientRemark} onChange={(e) => setNewClientRemark(e.target.value)} />
              </div>

              <div className="form-grid">
                <div style={{ fontWeight: 900 }}>사업자등록증</div>
                <input
                  className="input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setBizFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                <button className="btn dark" disabled={saving} onClick={createClient}>
                  {saving ? "저장 중..." : "거래처 등록"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}