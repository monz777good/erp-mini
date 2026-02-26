"use client";

import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string;
  name: string;
  ceoName?: string | null; // ✅ 대표자명
  bizNo?: string | null;
  addr?: string | null;
  tel?: string | null;

  careNo?: string | null;
  email?: string | null;
  remark?: string | null;

  createdAt?: string;
};

type Item = { id: string; name: string; price?: number };

type CartRow = { itemId: string; name: string; quantity: number };

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}
function norm(v: any) {
  return String(v ?? "").trim().toLowerCase();
}

function statusKo(status: any) {
  const s = String(status ?? "").toUpperCase();
  if (s === "REQUESTED") return "요청중";
  if (s === "APPROVED") return "승인";
  if (s === "REJECTED") return "거절";
  if (s === "DONE") return "출고완료";
  return s || "-";
}

export default function OrdersPage() {
  const [tab, setTab] = useState<"ORDER" | "QUERY" | "CLIENT">("ORDER");

  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);

  const [clientKeyword, setClientKeyword] = useState("");
  const [itemKeyword, setItemKeyword] = useState("");
  const [searchClientKeyword, setSearchClientKeyword] = useState("");

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(1);

  const [queryClientId, setQueryClientId] = useState<string>("");

  const [cart, setCart] = useState<CartRow[]>([]);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [mobile, setMobile] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // 거래처 등록
  const [newClientName, setNewClientName] = useState("");
  const [newClientCeoName, setNewClientCeoName] = useState(""); // ✅ 대표자명 추가
  const [newClientBizNo, setNewClientBizNo] = useState("");
  const [newClientAddr, setNewClientAddr] = useState("");
  const [newClientTel, setNewClientTel] = useState("");

  const [newClientCareNo, setNewClientCareNo] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientRemark, setNewClientRemark] = useState("");

  const [bizFile, setBizFile] = useState<File | null>(null);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  const mobileDigits = useMemo(() => digitsOnly(mobile), [mobile]);
  const mobileInvalid = useMemo(() => {
    if (!mobileDigits) return true;
    if (mobileDigits.length < 10) return true;
    if (mobileDigits.length > 11) return true;
    return false;
  }, [mobileDigits]);

  const careNoDigits = useMemo(() => digitsOnly(newClientCareNo), [newClientCareNo]);
  const careNoInvalid = useMemo(() => {
    if (!newClientCareNo.trim()) return false;
    return careNoDigits.length !== 8;
  }, [newClientCareNo, careNoDigits]);

  const filteredClientsForOrder = useMemo(() => {
    const kw = norm(clientKeyword);
    if (!kw) return clients;
    return clients.filter((c) =>
      norm(`${c.name ?? ""} ${c.ceoName ?? ""} ${c.addr ?? ""} ${c.bizNo ?? ""} ${c.tel ?? ""}`).includes(kw)
    );
  }, [clients, clientKeyword]);

  const filteredItemsForOrder = useMemo(() => {
    const kw = norm(itemKeyword);
    if (!kw) return items;
    return items.filter((it) => norm(it.name).includes(kw));
  }, [items, itemKeyword]);

  const filteredClientsForSearch = useMemo(() => {
    const kw = norm(searchClientKeyword);
    if (!kw) return clients;
    return clients.filter((c) =>
      norm(`${c.name ?? ""} ${c.ceoName ?? ""} ${c.addr ?? ""} ${c.bizNo ?? ""} ${c.tel ?? ""}`).includes(kw)
    );
  }, [clients, searchClientKeyword]);

  async function loadAll() {
    setLoadingBase(true);
    setError("");
    setOkMsg("");

    try {
      const [itemsRes, clientsRes] = await Promise.all([
        fetch("/api/items", { credentials: "include", cache: "no-store" }),
        fetch("/api/sales/clients", { credentials: "include", cache: "no-store" }),
      ]);

      const itemsJson = await itemsRes.json().catch(() => null);
      const clientsJson = await clientsRes.json().catch(() => null);

      const itemsList = Array.isArray(itemsJson) ? itemsJson : itemsJson?.items ?? [];
      const clientsList = Array.isArray(clientsJson?.clients) ? clientsJson.clients : [];

      setItems(itemsList);
      setClients(clientsList);

      if (!selectedItemId && itemsList?.[0]?.id) setSelectedItemId(itemsList[0].id);
      if (!selectedClientId && clientsList?.[0]?.id) setSelectedClientId(clientsList[0].id);
      if (!queryClientId && clientsList?.[0]?.id) setQueryClientId(clientsList[0].id);
    } catch {
      setError("데이터 불러오기 실패");
    } finally {
      setLoadingBase(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!it) return setError("품목 필요");

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
    setCart((prev) =>
      prev.map((r) => (r.itemId === itemId ? { ...r, quantity: Math.max(1, Number(qty) || 1) } : r))
    );
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
      if (!(mob.length === 10 || mob.length === 11)) throw new Error("핸드폰 필요");

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

      if (newClientCareNo.trim()) {
        if (careNoDigits.length !== 8) {
          throw new Error("요양기관번호는 숫자만 8자리로 입력하세요.");
        }
      }

      const fd = new FormData();
      fd.append("name", newClientName.trim());
      fd.append("ceoName", newClientCeoName.trim()); // ✅ 대표자명 전송
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
      setNewClientCeoName(""); // ✅ 초기화
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

  const wrap: React.CSSProperties = { maxWidth: 980, margin: "22px auto", padding: "0 16px" };
  const card: React.CSSProperties = { background: "white", border: "1px solid #eee", borderRadius: 16, padding: 18 };
  const tabs: React.CSSProperties = { display: "flex", gap: 10, marginBottom: 16 };
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: active ? "#111" : "white",
    color: active ? "white" : "#111",
    fontWeight: 900,
    cursor: "pointer",
  });
  const row: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
  };
  const input: React.CSSProperties = { padding: "11px 12px", borderRadius: 12, border: "1px solid #ddd", outline: "none" };
  const select: React.CSSProperties = { ...input, background: "white" };
  const right: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 10 };

  if (loadingBase) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: 30, fontWeight: 950, marginBottom: 12 }}>영업사원 주문</h1>
        <div style={card}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 30, fontWeight: 950, marginBottom: 12 }}>영업사원 주문</h1>

      <div style={tabs}>
        <button style={tabBtn(tab === "ORDER")} onClick={() => setTab("ORDER")}>주문</button>
        <button style={tabBtn(tab === "QUERY")} onClick={() => setTab("QUERY")}>조회</button>
        <button style={tabBtn(tab === "CLIENT")} onClick={() => setTab("CLIENT")}>거래처 등록</button>
        <div style={{ flex: 1 }} />
        <button style={{ ...tabBtn(false), background: "white" }} onClick={loadAll}>새로고침</button>
      </div>

      {error ? (
        <div style={{ ...card, borderColor: "crimson", color: "crimson", fontWeight: 900, marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      {okMsg ? (
        <div style={{ ...card, borderColor: "#4caf50", color: "#1b5e20", fontWeight: 900, marginBottom: 12 }}>
          {okMsg}
        </div>
      ) : null}

      {tab === "ORDER" && (
        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 950, marginBottom: 14 }}>주문요청</h2>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>거래처 검색</div>
            <input
              style={input}
              placeholder="거래처 검색 (이름/주소/사업자번호/전화)"
              value={clientKeyword}
              onChange={(e) => setClientKeyword(e.target.value)}
            />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>거래처(선택)</div>
            <select style={select} value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
              <option value="">(선택안함)</option>
              {filteredClientsForOrder.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>품목 검색</div>
            <input style={input} placeholder="품목 검색" value={itemKeyword} onChange={(e) => setItemKeyword(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>품목</div>
            <select style={select} value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
              <option value="">(선택)</option>
              {filteredItemsForOrder.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>수량</div>
            <input style={input} value={addQty} onChange={(e) => setAddQty(Number(e.target.value))} />
          </div>

          <div style={right}>
            <button
              onClick={addToCart}
              style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "white", fontWeight: 950, cursor: "pointer" }}
            >
              장바구니 담기
            </button>
          </div>

          <div style={{ height: 18 }} />

          <h3 style={{ fontSize: 16, fontWeight: 950, marginBottom: 10 }}>장바구니 (여러 품목 한번에)</h3>

          {cart.length === 0 ? (
            <div style={{ color: "#777" }}>장바구니가 비었습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {cart.map((r) => (
                <div
                  key={r.itemId}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 14,
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 80px",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{r.name}</div>
                  <input style={input} value={r.quantity} onChange={(e) => changeCartQty(r.itemId, Number(e.target.value))} />
                  <button
                    onClick={() => removeCart(r.itemId)}
                    style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid crimson", background: "white", color: "crimson", fontWeight: 950, cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: 16, fontWeight: 950, marginBottom: 10 }}>배송정보</h3>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>수하인</div>
            <input style={input} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>주소</div>
            <input style={input} value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>
              핸드폰 <span style={{ color: "crimson" }}>*</span>
            </div>
            <input style={input} placeholder="숫자만/하이픈 가능" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>

          {mobileInvalid ? (
            <div style={{ marginLeft: 140, color: "crimson", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>
              핸드폰은 필수입니다. (숫자만 10~11자리)
            </div>
          ) : null}

          <div style={row}>
            <div style={{ fontWeight: 900 }}>전화(선택)</div>
            <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>배송메시지</div>
            <input style={input} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <div style={right}>
            <button
              onClick={submitCartOrder}
              disabled={saving}
              style={{ padding: "12px 18px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "white", fontWeight: 950, cursor: "pointer", minWidth: 120 }}
            >
              {saving ? "처리중..." : "주문하기"}
            </button>
          </div>
        </div>
      )}

      {tab === "CLIENT" && (
        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 950, marginBottom: 14 }}>거래처 등록</h2>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>거래처명</div>
            <input style={input} value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
          </div>

          {/* ✅ 대표자명: 거래처명 아래 */}
          <div style={row}>
            <div style={{ fontWeight: 900 }}>대표자명</div>
            <input style={input} value={newClientCeoName} onChange={(e) => setNewClientCeoName(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>사업자번호</div>
            <input style={input} value={newClientBizNo} onChange={(e) => setNewClientBizNo(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>주소</div>
            <input style={input} value={newClientAddr} onChange={(e) => setNewClientAddr(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>전화</div>
            <input style={input} value={newClientTel} onChange={(e) => setNewClientTel(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>요양기관번호</div>
            <input style={input} placeholder="숫자만 8자리" value={newClientCareNo} onChange={(e) => setNewClientCareNo(e.target.value)} />
          </div>

          {careNoInvalid ? (
            <div style={{ marginLeft: 140, color: "crimson", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>
              요양기관번호는 숫자만 8자리로 입력하세요.
            </div>
          ) : null}

          <div style={row}>
            <div style={{ fontWeight: 900 }}>이메일</div>
            <input style={input} placeholder="예: abc@clinic.com" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>비고</div>
            <input style={input} placeholder="메모/참고사항" value={newClientRemark} onChange={(e) => setNewClientRemark(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>사업자등록증</div>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setBizFile(e.target.files?.[0] ?? null)} />
          </div>

          <div style={right}>
            <button
              onClick={createClient}
              disabled={saving}
              style={{ padding: "12px 18px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "white", fontWeight: 950, cursor: "pointer", minWidth: 120 }}
            >
              {saving ? "처리중..." : "거래처 등록"}
            </button>
          </div>
        </div>
      )}

      {tab === "QUERY" && (
        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 950, marginBottom: 14 }}>조회</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 10, marginBottom: 12 }}>
            <input style={input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input style={input} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <button
              onClick={loadOrders}
              style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #111", background: "white", fontWeight: 950, cursor: "pointer" }}
            >
              {loadingOrders ? "불러오는중" : "조회"}
            </button>
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>거래처 검색</div>
            <input style={input} placeholder="거래처 검색" value={searchClientKeyword} onChange={(e) => setSearchClientKeyword(e.target.value)} />
          </div>

          <div style={row}>
            <div style={{ fontWeight: 900 }}>거래처(필터)</div>
            <select style={select} value={queryClientId} onChange={(e) => setQueryClientId(e.target.value)}>
              <option value="">(전체)</option>
              {filteredClientsForSearch.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 14, color: "#777" }}>
            조회 탭은 다음 단계에서 “기간조회 + 승인/거절 상태 확인”로 확장하면 됨.
          </div>

          <div style={{ marginTop: 14 }}>
            {orders.length === 0 ? (
              <div style={{ color: "#777" }}>조회 결과 없음</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.map((o: any) => (
                  <div key={o.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
                    <div style={{ fontWeight: 950 }}>
                      {o?.item?.name ?? "-"} / 수량 {o.quantity} / {statusKo(o.status)}
                    </div>
                    <div style={{ color: "#555", marginTop: 6 }}>
                      {o.receiverName} / {o.receiverAddr}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}