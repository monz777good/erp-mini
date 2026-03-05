// src/app/orders/OrdersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

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

  createdAt: string;
};

type ItemRow = {
  id: string;
  name: string;
};

type CartLine = {
  itemId: string;
  itemName: string;
  qty: number;
};

type OrderRow = {
  id: string;
  status?: string | null;
  createdAt?: string | null;

  // 백엔드가 어떤 형태로 내려주든 최대한 보여주기
  quantity?: number | null;
  itemName?: string | null;
  items?: { name?: string | null; quantity?: number | null }[] | null;
  lines?: { itemName?: string | null; quantity?: number | null }[] | null;

  clientName?: string | null;
  client?: { name?: string | null } | null;

  receiverName?: string | null;
  receiverAddr?: string | null;
  receiverTel?: string | null;
  receiverMobile?: string | null;

  note?: string | null;
};

function s(v: any) {
  return String(v ?? "").trim();
}

function ymdKst(d: Date) {
  // YYYY-MM-DD (KST 기준)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function OrdersClient() {
  const [tab, setTab] = useState<"new" | "list" | "clients" | "newClient">("new");

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");

  // 주문
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [cart, setCart] = useState<CartLine[]>([]);

  // 조회
  const [fromYmd, setFromYmd] = useState<string>(() => ymdKst(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [toYmd, setToYmd] = useState<string>(() => ymdKst(new Date()));
  const [q, setQ] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // 거래처 등록
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

  async function fetchJSON(url: string, init?: RequestInit) {
    const res = await fetch(url, { credentials: "include", ...init });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || data?.message || `HTTP_${res.status}`);
    }
    return data;
  }

  async function refreshBase() {
    setErrMsg("");
    const [c, i] = await Promise.all([fetchJSON("/api/sales/clients"), fetchJSON("/api/items")]);
    setClients(c.clients || []);
    setItems(i.items || []);
  }

  useEffect(() => {
    refreshBase().catch((e) => setErrMsg(String(e?.message || e)));
  }, []);

  // 조회 탭 들어가면 자동 조회 1번
  useEffect(() => {
    if (tab !== "list") return;
    fetchOrders().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const selectedClient = useMemo(
    () => clients.find((x) => x.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const selectedItem = useMemo(
    () => items.find((x) => x.id === selectedItemId) || null,
    [items, selectedItemId]
  );

  function addToCart() {
    setErrMsg("");
    if (!selectedItem) {
      setErrMsg("ITEM_REQUIRED");
      return;
    }
    const qn = Math.max(1, Number(qty || 1));
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.itemId === selectedItem.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qn };
        return copy;
      }
      return [...prev, { itemId: selectedItem.id, itemName: selectedItem.name, qty: qn }];
    });
  }

  function removeCart(itemId: string) {
    setCart((prev) => prev.filter((p) => p.itemId !== itemId));
  }
  function incCart(itemId: string) {
    setCart((prev) => prev.map((p) => (p.itemId === itemId ? { ...p, qty: p.qty + 1 } : p)));
  }
  function decCart(itemId: string) {
    setCart((prev) => prev.map((p) => (p.itemId === itemId ? { ...p, qty: Math.max(1, p.qty - 1) } : p)));
  }

  async function submitOrder() {
    setErrMsg("");
    if (!selectedClientId) {
      setErrMsg("CLIENT_REQUIRED");
      return;
    }
    if (cart.length === 0) {
      setErrMsg("CART_EMPTY");
      return;
    }

    setLoading(true);
    try {
      await fetchJSON("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          lines: cart.map((x) => ({ itemId: x.itemId, quantity: x.qty })),
        }),
      });

      setCart([]);
      setSelectedItemId("");
      setQty(1);
      setTab("list");
    } catch (e: any) {
      setErrMsg(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    setErrMsg("");
    setListLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("from", fromYmd);
      qs.set("to", toYmd);
      if (s(q)) qs.set("q", s(q));

      // ✅ 네 프로젝트에서 이미 쓰던 형태(기간 파라미터) 최대한 유지
      const r = await fetchJSON(`/api/orders?${qs.toString()}`);
      setOrders(r.orders || []);
    } catch (e: any) {
      setErrMsg(String(e?.message || e));
      setOrders([]);
    } finally {
      setListLoading(false);
    }
  }

  function renderItemsCell(o: any) {
    const arr =
      o?.items ??
      o?.lines ??
      (o?.itemName
        ? [{ name: o.itemName, quantity: o.quantity ?? null }]
        : null);

    if (!arr || !Array.isArray(arr) || arr.length === 0) return "-";

    // "품목명 x수량" 줄바꿈
    return (
      <div className="whitespace-pre-line">
        {arr
          .map((it: any) => {
            const nm = it?.name ?? it?.itemName ?? "";
            const qt = it?.quantity ?? it?.qty ?? "";
            if (!nm && !qt) return "";
            if (nm && qt) return `${nm} (${qt})`;
            return nm || String(qt);
          })
          .filter(Boolean)
          .join("\n")}
      </div>
    );
  }

  async function uploadBizFile(clientId: string, file: File) {
    const fd = new FormData();
    fd.append("clientId", clientId);
    fd.append("file", file);

    await fetchJSON("/api/sales/clients/bizfile", {
      method: "POST",
      body: fd,
    });
  }

  async function createClient() {
    setErrMsg("");
    if (!s(cName)) {
      setErrMsg("CLIENT_NAME_REQUIRED");
      return;
    }

    setLoading(true);
    try {
      const r = await fetchJSON("/api/sales/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cName,
          address: cAddress,
          ownerName: cOwnerName,
          careInstitutionNo: cCareNo,
          bizRegNo: cBizNo,

          receiverName: cRecvName,
          receiverAddr: cRecvAddr,
          receiverTel: cRecvTel,
          receiverMobile: cRecvMobile,
        }),
      });

      const created: ClientRow = r.client;

      // ✅ 등록 직후 파일까지 업로드해서 DB에 bizFileUrl/bizFileName 저장
      if (bizFile) {
        await uploadBizFile(created.id, bizFile);
      }

      // 초기화 + 새로고침
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
      setErrMsg(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetchJSON("/api/logout", { method: "POST" });
    } catch {}
    location.href = "/";
  }

  return (
    <div className="w-full">
      {/* 상단: 탭 + 로그아웃 */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-full ${tab === "new" ? "bg-white text-black" : "bg-white/10 text-white"}`}
            onClick={() => setTab("new")}
            type="button"
          >
            주문요청
          </button>
          <button
            className={`px-4 py-2 rounded-full ${tab === "list" ? "bg-white text-black" : "bg-white/10 text-white"}`}
            onClick={() => setTab("list")}
            type="button"
          >
            조회
          </button>
          <button
            className={`px-4 py-2 rounded-full ${tab === "clients" ? "bg-white text-black" : "bg-white/10 text-white"}`}
            onClick={() => setTab("clients")}
            type="button"
          >
            거래처 목록
          </button>
          <button
            className={`px-4 py-2 rounded-full ${tab === "newClient" ? "bg-white text-black" : "bg-white/10 text-white"}`}
            onClick={() => setTab("newClient")}
            type="button"
          >
            거래처 등록
          </button>
        </div>

        <button
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/10"
          onClick={logout}
          type="button"
        >
          로그아웃
        </button>
      </div>

      {errMsg ? (
        <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm">{errMsg}</div>
      ) : null}

      {/* 주문요청 */}
      {tab === "new" && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
          <div className="text-sm text-white/70">거래처/품목 선택 + 배송정보 입력 후 주문요청</div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">거래처 검색/선택</div>
            <select
              className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">거래처를 선택하세요</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* 선택된 거래처 배송정보 미리보기 */}
            {selectedClient ? (
              <div className="text-xs text-white/60 mt-2 whitespace-pre-line">
                수하인: {selectedClient.receiverName || "-"}{"\n"}
                배송지: {selectedClient.receiverAddr || "-"}{"\n"}
                전화: {selectedClient.receiverTel || "-"} / 핸드폰: {selectedClient.receiverMobile || "-"}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">품목 선택</div>
            <select
              className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">품목을 선택하세요</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10"
              onClick={() => setQty((p) => Math.max(1, p - 1))}
              type="button"
            >
              -
            </button>
            <div className="w-16 text-center">{qty}</div>
            <button
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10"
              onClick={() => setQty((p) => p + 1)}
              type="button"
            >
              +
            </button>

            <button
              className="ml-2 px-4 py-2 rounded-xl bg-white text-black font-semibold"
              onClick={addToCart}
              type="button"
            >
              담기
            </button>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">장바구니</div>
              <div className="text-sm text-white/70">총 {cart.length}개</div>
            </div>

            {cart.length === 0 ? (
              <div className="text-sm text-white/60">담긴 품목이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <div
                    key={c.itemId}
                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3"
                  >
                    <div>
                      <div className="font-semibold">{c.itemName}</div>
                      <div className="text-sm text-white/70">수량: {c.qty}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="w-9 h-9 rounded-xl bg-white/10 border border-white/10"
                        onClick={() => decCart(c.itemId)}
                        type="button"
                      >
                        -
                      </button>
                      <button
                        className="w-9 h-9 rounded-xl bg-white/10 border border-white/10"
                        onClick={() => incCart(c.itemId)}
                        type="button"
                      >
                        +
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30"
                        onClick={() => removeCart(c.itemId)}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-bold disabled:opacity-50"
                onClick={submitOrder}
                disabled={loading}
                type="button"
              >
                {loading ? "처리중..." : "주문요청"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 조회 */}
      {tab === "list" && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
          <div className="text-sm text-white/70">기간 조회는 한국시간 기준</div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="rounded-xl bg-white/5 border border-white/10 p-2"
              value={fromYmd}
              onChange={(e) => setFromYmd(e.target.value)}
            />
            <div className="text-white/50">~</div>
            <input
              type="date"
              className="rounded-xl bg-white/5 border border-white/10 p-2"
              value={toYmd}
              onChange={(e) => setToYmd(e.target.value)}
            />

            <input
              className="flex-1 min-w-[220px] rounded-xl bg-white/5 border border-white/10 p-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색(품목/거래처/수하인/전화/비고)"
            />

            <button
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/10"
              onClick={() => fetchOrders()}
              type="button"
              disabled={listLoading}
            >
              {listLoading ? "조회중..." : "조회"}
            </button>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3">등록일</th>
                  <th className="text-left p-3">거래처</th>
                  <th className="text-left p-3">품목(수량)</th>
                  <th className="text-left p-3">상태</th>
                  <th className="text-left p-3">수하인</th>
                  <th className="text-left p-3">주소</th>
                  <th className="text-left p-3">전화</th>
                  <th className="text-left p-3">핸드폰</th>
                  <th className="text-left p-3">비고</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td className="p-4 text-white/60" colSpan={9}>
                      조회 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-t border-white/10 align-top">
                      <td className="p-3 text-white/80 whitespace-nowrap">
                        {o.createdAt ? String(o.createdAt).slice(0, 19).replace("T", " ") : "-"}
                      </td>
                      <td className="p-3 text-white/90">
                        {o.clientName || o.client?.name || "-"}
                      </td>
                      <td className="p-3 text-white/90">{renderItemsCell(o as any)}</td>
                      <td className="p-3 text-white/80 whitespace-nowrap">{o.status || "-"}</td>
                      <td className="p-3 text-white/90">{o.receiverName || "-"}</td>
                      <td className="p-3 text-white/80 whitespace-pre-line">{o.receiverAddr || "-"}</td>
                      <td className="p-3 text-white/80 whitespace-nowrap">{o.receiverTel || "-"}</td>
                      <td className="p-3 text-white/80 whitespace-nowrap">{o.receiverMobile || "-"}</td>
                      <td className="p-3 text-white/70 whitespace-pre-line">{o.note || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 거래처 목록 */}
      {tab === "clients" && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">거래처 목록</div>
            <button
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/10"
              onClick={() => refreshBase().catch((e) => setErrMsg(String(e?.message || e)))}
              type="button"
            >
              새로고침
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="text-sm text-white/60">거래처가 없습니다.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {clients.map((c) => (
                <div key={c.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-lg truncate">{c.name}</div>
                      <div className="text-sm text-white/70">
                        대표: {c.ownerName || "-"} · 요양기관번호: {c.careInstitutionNo || "-"} · 사업자등록번호:{" "}
                        {c.bizRegNo || "-"}
                      </div>

                      <div className="mt-2 text-sm text-white/70">
                        사업자등록증:{" "}
                        {c.bizFileUrl ? (
                          <a
                            href={c.bizFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {c.bizFileName || "다운로드"}
                          </a>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>

                    <button
                      className="px-4 py-2 rounded-xl bg-white text-black font-semibold shrink-0"
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setTab("new");
                      }}
                      type="button"
                    >
                      주문요청에서 선택
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 거래처 등록 */}
      {tab === "newClient" && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
          <div className="font-semibold text-lg">거래처 등록</div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-semibold">거래처명 *</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="거래처명을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">대표자명</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cOwnerName}
                onChange={(e) => setCOwnerName(e.target.value)}
                placeholder="대표자명을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">요양기관번호</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cCareNo}
                onChange={(e) => setCCareNo(e.target.value)}
                placeholder="요양기관번호"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">사업자등록번호</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cBizNo}
                onChange={(e) => setCBizNo(e.target.value)}
                placeholder="사업자등록번호"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="text-sm font-semibold">주소</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
                placeholder="주소"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">수하인</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cRecvName}
                onChange={(e) => setCRecvName(e.target.value)}
                placeholder="수하인"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">배송지</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cRecvAddr}
                onChange={(e) => setCRecvAddr(e.target.value)}
                placeholder="배송지"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">전화</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cRecvTel}
                onChange={(e) => setCRecvTel(e.target.value)}
                placeholder="전화"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">핸드폰</div>
              <input
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                value={cRecvMobile}
                onChange={(e) => setCRecvMobile(e.target.value)}
                placeholder="핸드폰"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="text-sm font-semibold">사업자등록증 첨부</div>
              <input
                type="file"
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3"
                onChange={(e) => setBizFile(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-white/60">파일을 선택하면 등록 시 자동 업로드 됩니다.</div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/10"
              onClick={() => setTab("clients")}
              type="button"
            >
              목록으로
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-bold disabled:opacity-50"
              onClick={createClient}
              disabled={loading}
              type="button"
            >
              {loading ? "처리중..." : "등록"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}