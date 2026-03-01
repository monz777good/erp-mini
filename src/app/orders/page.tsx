"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; name: string };
type Client = { id: string; name: string; ownerName?: string | null };

export default function OrdersPage() {
  const router = useRouter();

  const [err, setErr] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [clientQuery, setClientQuery] = useState("");
  const [itemQuery, setItemQuery] = useState("");

  const [clientId, setClientId] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [note, setNote] = useState("");

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.ownerName ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [clients, clientQuery]);

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, itemQuery]);

  async function load() {
    setErr("");
    try {
      const [itemsRes, clientsRes] = await Promise.all([
        fetch("/api/items", { credentials: "include" }),
        fetch("/api/sales/clients", { credentials: "include" }),
      ]);

      // 로그인 풀렸으면 로그인으로
      if (itemsRes.status === 401 || clientsRes.status === 401) {
        router.replace("/login");
        return;
      }

      if (!itemsRes.ok) throw new Error("품목 불러오기 실패");
      if (!clientsRes.ok) throw new Error("거래처 불러오기 실패");

      const itemsJson = await itemsRes.json();
      const clientsJson = await clientsRes.json();

      setItems(Array.isArray(itemsJson) ? itemsJson : itemsJson?.items ?? []);
      setClients(
        Array.isArray(clientsJson) ? clientsJson : clientsJson?.clients ?? []
      );
    } catch (e: any) {
      setErr(e?.message || "서버 오류");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    router.replace("/login");
  }

  async function submitOrder() {
    setErr("");
    try {
      if (!itemId) return setErr("품목을 선택해줘");
      if (!receiverName.trim()) return setErr("수하인명을 입력해줘");
      if (!receiverAddr.trim()) return setErr("주소를 입력해줘");

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemId,
          clientId: clientId || null,
          quantity: Number(qty || 1),
          receiverName: receiverName.trim(),
          receiverPhone: String(receiverPhone || "").replace(/\D/g, ""),
          receiverAddr: receiverAddr.trim(),
          note: note?.trim() || null,
        }),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "주문 요청 실패");
      }

      alert("주문 요청 완료");
      // 입력 일부 초기화
      setItemId("");
      setQty(1);
      setReceiverName("");
      setReceiverPhone("");
      setReceiverAddr("");
      setNote("");
    } catch (e: any) {
      setErr(e?.message || "서버 오류");
    }
  }

  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="topbar">
          <div className="brand">한의N원외탕전 ERP</div>

          <div className="nav">
            <a className="pill primary" href="/orders">
              주문
            </a>
            <a className="pill" href="/orders?tab=history">
              조회
            </a>
            <a className="pill" href="/clients/new">
              거래처 등록
            </a>
          </div>

          <div className="actions">
            <button className="pill" type="button" onClick={load}>
              새로고침
            </button>
            <button className="pill" type="button" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>

        <div className="content">
          {err ? <div className="error-banner">{err}</div> : null}

          <div className="section-title">주문요청</div>
          <div className="muted">거래처/품목을 검색하고 배송정보 입력 후 주문요청</div>

          <div style={{ height: 12 }} />

          {/* 입력 폼 */}
          <div
            style={{
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 18,
              padding: 16,
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitOrder();
              }}
            >
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>거래처 검색</label>
                  <input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="거래처 검색 (이름/대표자)"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label>거래처(선택)</label>
                  <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                    <option value="">(선택안함)</option>
                    {filteredClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.ownerName ? ` / ${c.ownerName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label>품목 검색</label>
                  <input
                    value={itemQuery}
                    onChange={(e) => setItemQuery(e.target.value)}
                    placeholder="품목 검색"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label>품목</label>
                  <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                    <option value="">(선택)</option>
                    {filteredItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>수량</label>
                  <input
                    value={String(qty)}
                    onChange={(e) => setQty(Number(e.target.value || 1))}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label>수하인명</label>
                  <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                </div>

                <div>
                  <label>전화번호</label>
                  <input
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="숫자만"
                    inputMode="numeric"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label>주소 전체</label>
                  <input value={receiverAddr} onChange={(e) => setReceiverAddr(e.target.value)} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label>배송메세지(선택)</label>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 취급주의" />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button className="primary" type="submit">
                  주문 요청
                </button>
              </div>
            </form>
          </div>

          <div style={{ height: 16 }} />

          <div className="muted">※ 조회/목록(장바구니 등)은 다음 단계에서 예쁘게 카드로 붙여줄게.</div>
        </div>
      </div>
    </div>
  );
}