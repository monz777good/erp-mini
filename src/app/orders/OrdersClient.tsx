// src/app/orders/OrdersClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "SALES" | "ADMIN";

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

function s(v: any) {
  return String(v ?? "").trim();
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
    const res = await fetch(url, {
      credentials: "include",
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `HTTP_${res.status}`);
    }
    return data;
  }

  async function refreshBase() {
    setErrMsg("");
    const [c, i] = await Promise.all([
      fetchJSON("/api/sales/clients"),
      fetchJSON("/api/items"),
    ]);
    setClients(c.clients || []);
    setItems(i.items || []);
  }

  useEffect(() => {
    refreshBase().catch((e) => setErrMsg(String(e?.message || e)));
  }, []);

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
    const q = Math.max(1, Number(qty || 1));
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.itemId === selectedItem.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + q };
        return copy;
      }
      return [...prev, { itemId: selectedItem.id, itemName: selectedItem.name, qty: q }];
    });
  }

  function removeCart(itemId: string) {
    setCart((prev) => prev.filter((p) => p.itemId !== itemId));
  }

  function incCart(itemId: string) {
    setCart((prev) =>
      prev.map((p) => (p.itemId === itemId ? { ...p, qty: p.qty + 1 } : p))
    );
  }

  function decCart(itemId: string) {
    setCart((prev) =>
      prev.map((p) =>
        p.itemId === itemId ? { ...p, qty: Math.max(1, p.qty - 1) } : p
      )
    );
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

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className={`px-4 py-2 rounded-full ${tab === "new" ? "bg-white text-black" : "bg-white/10 text-white"}`}
          onClick={() => setTab("new")}
        >
          주문요청
        </button>
        <button
          className={`px-4 py-2 rounded-full ${tab === "list" ? "bg-white text-black" : "bg-white/10 text-white"}`}
          onClick={() => setTab("list")}
        >
          조회
        </button>
        <button
          className={`px-4 py-2 rounded-full ${tab === "clients" ? "bg-white text-black" : "bg-white/10 text-white"}`}
          onClick={() => setTab("clients")}
        >
          거래처 목록
        </button>
        <button
          className={`px-4 py-2 rounded-full ${tab === "newClient" ? "bg-white text-black" : "bg-white/10 text-white"}`}
          onClick={() => setTab("newClient")}
        >
          거래처 등록
        </button>
      </div>

      {errMsg ? (
        <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm">
          {errMsg}
        </div>
      ) : null}

      {/* 주문요청 */}
      {tab === "new" && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
          <div className="text-sm text-white/70">
            거래처/품목 선택 + 배송정보 입력 후 주문요청
          </div>

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
              >
                {loading ? "처리중..." : "주문요청"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 조회(간단 placeholder) */}
      {tab === "list" && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-sm text-white/70">조회는 관리자 화면에서 확인하세요.</div>
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
                      <div className="text-sm text-white/70">등록번호: {c.id}</div>

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
              <div className="text-xs text-white/60">
                파일을 선택하면 등록 시 자동 업로드 됩니다.
              </div>
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