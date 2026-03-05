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
  // YYYY-MM-DD in Asia/Seoul
  const s = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
  return s; // sv-SE gives YYYY-MM-DD
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
    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onClose();
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
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
  renderLine,
}: {
  label: string;
  placeholder: string;
  items: Array<{ id: string; name: string }>;
  valueId: string;
  onChangeId: (id: string) => void;
  search: string;
  onChangeSearch: (v: string) => void;
  renderLine?: (it: { id: string; name: string }) => string;
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
                  {renderLine ? (
                    <div className="text-xs text-white/60 mt-1">{renderLine(it)}</div>
                  ) : null}
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

  // 검색(콤보박스)
  const [clientSearch, setClientSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  // 선택
  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // 배송정보(주문에 저장되는 값)
  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");

  // 거래처 등록 폼(요구사항 풀세트)
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCareNo, setNewCareNo] = useState("");
  const [newBizNo, setNewBizNo] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const [newReceiverName, setNewReceiverName] = useState("");
  const [newReceiverAddr, setNewReceiverAddr] = useState("");
  const [newReceiverTel, setNewReceiverTel] = useState("");
  const [newReceiverMobile, setNewReceiverMobile] = useState("");
  const [newBizFile, setNewBizFile] = useState<File | null>(null);

  // 조회 기간 (KST 오늘 기준)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) || null,
    [clients, clientId]
  );

  // ✅ 거래처 선택 시 자동 채움 (수하인/주소/연락처)
  useEffect(() => {
    if (!selectedClient) return;
    setReceiverName(selectedClient.receiverName ?? "");
    setReceiverAddr(selectedClient.receiverAddr ?? "");
    setPhone(selectedClient.receiverTel ?? "");
    setMobile(selectedClient.receiverMobile ?? "");
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

    const today = kstTodayYmd();
    const from = addDaysYmd(today, -7);
    setToDate(today);
    setFromDate(from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    setErrMsg(null);
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/login";
    }
  }

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

  async function uploadBizFile(clientId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/sales/clients/${clientId}/bizfile`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) throw new Error(data?.error || `HTTP_${res.status}`);
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

      if (newBizFile) {
        await uploadBizFile(r.client.id, newBizFile);
      }

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
      setNewBizFile(null);
    } catch (e: any) {
      setErrMsg(e?.message || "FAILED_CREATE_CLIENT");
    }
  }

  // ===== styles
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-extrabold text-white">주문</div>
              <div className="text-white/60 text-sm mt-1">거래처/품목 선택 + 배송정보 입력 후 주문요청</div>
            </div>

            {/* ✅ 로그아웃 복구 (우상단) */}
            <button className={cls(btn, "h-[44px]")} onClick={logout}>
              로그아웃
            </button>
          </div>

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

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
              {errMsg}
            </div>
          ) : null}

          {loadingBase ? (
            <div className="mt-6 text-white/70">불러오는 중...</div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
              {/* 주문요청 */}
              {tab === "request" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-5">
                    <ComboBox
                      label="거래처 검색/선택"
                      placeholder="거래처명을 입력하세요"
                      items={clients.map((c) => ({ id: c.id, name: c.name }))}
                      valueId={clientId}
                      onChangeId={setClientId}
                      search={clientSearch}
                      onChangeSearch={setClientSearch}
                    />

                    {clients.length === 0 ? (
                      <button className={cls(btn, "w-full")} onClick={() => setTab("clientsNew")}>
                        거래처가 없습니다 → 거래처 등록하러 가기
                      </button>
                    ) : null}

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
                  </div>

                  <div className={panel}>
                    <div className="text-white font-bold">배송 정보</div>
                    <div className="text-white/60 text-sm mt-1">
                      거래처 선택 시 수하인/주소/연락처 자동 채움됩니다.
                    </div>

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

              {/* 거래처 등록 */}
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
                          <input className={input} value={newReceiverMobile} onChange={(e) => setNewReceiverMobile(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <div className={label}>사업자등록증 첨부</div>
                        <input
                          className={cls(input, "py-2")}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setNewBizFile(e.target.files?.[0] || null)}
                        />
                        <div className="text-xs text-white/50 mt-1">
                          업로드는 BLOB_READ_WRITE_TOKEN 설정 시 동작합니다.
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-1">
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
                            setNewBizFile(null);
                          }}
                        >
                          초기화
                        </button>
                        <button className={btn} onClick={() => setTab("clients")}>
                          거래처 목록 보기
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={panel}>
                    <div className="text-white font-bold">등록 후 동작</div>
                    <ul className="mt-3 text-white/70 text-sm space-y-2 list-disc pl-5">
                      <li>등록 즉시 거래처 목록/주문요청 선택창에 반영됩니다.</li>
                      <li>주문요청에서 거래처 선택하면 수하인/주소/연락처가 자동 채움됩니다.</li>
                      <li>드롭다운 흰색 문제는 커스텀 목록으로 해결했습니다.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 거래처 목록 */}
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

                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {clients
                      .filter((c) => c.name.toLowerCase().includes(clientSearch.trim().toLowerCase()))
                      .map((c) => (
                        <div key={c.id} className={panel}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-white font-bold text-lg">{c.name}</div>
                              <div className="text-white/60 text-sm mt-1">
                                대표: {c.ownerName || "-"} · 요양기관번호: {c.careInstitutionNo || "-"} · 사업자등록번호: {c.bizRegNo || "-"}
                              </div>
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
                            <div>거래처 주소: {c.address || "-"}</div>
                            <div>수하인: {c.receiverName || "-"}</div>
                            <div>배송지: {c.receiverAddr || "-"}</div>
                            <div>전화: {c.receiverTel || "-"}</div>
                            <div>휴대폰: {c.receiverMobile || "-"}</div>

                            {c.bizFileUrl ? (
                              <div className="pt-2">
                                <a
                                  className="inline-block text-white underline underline-offset-4"
                                  href={c.bizFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  사업자등록증 보기: {c.bizFileName || "파일"}
                                </a>
                              </div>
                            ) : (
                              <div className="pt-2 text-white/50">사업자등록증: 없음</div>
                            )}
                          </div>
                        </div>
                      ))}
                    {clients.length === 0 ? <div className="text-white/70">거래처가 없습니다.</div> : null}
                  </div>
                </div>
              )}

              {/* 조회 */}
              {tab === "list" && (
                <div>
                  <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-5">
                    <div className="flex gap-3 flex-wrap">
                      <div>
                        <div className={label}>시작일 (KST)</div>
                        <input type="date" className={input} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      </div>
                      <div>
                        <div className={label}>종료일 (KST)</div>
                        <input type="date" className={input} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className={btnPrimary} onClick={refreshOrders}>기간 조회</button>
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
                    ) : (
                      <div className="rounded-2xl border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-12 bg-white/10 px-4 py-3 text-white/80 text-sm font-semibold">
                          <div className="col-span-2">날짜</div>
                          <div className="col-span-2">상태</div>
                          <div className="col-span-2">거래처</div>
                          <div className="col-span-2">대표/연락</div>
                          <div className="col-span-2">주소</div>
                          <div className="col-span-1 text-right">수량</div>
                          <div className="col-span-1">품목</div>
                        </div>

                        {orders.length === 0 ? (
                          <div className="px-4 py-6 text-white/70">조회 결과가 없습니다.</div>
                        ) : (
                          orders.map((o) => (
                            <div key={o.id} className="grid grid-cols-12 px-4 py-3 border-t border-white/10 text-white/90 text-sm">
                              <div className="col-span-2">{new Date(o.createdAt).toLocaleDateString("ko-KR")}</div>
                              <div className="col-span-2">{o.status}</div>
                              <div className="col-span-2">
                                <div className="font-semibold">{o.client?.name || "-"}</div>
                                <div className="text-white/60 text-xs truncate">{o.client?.address || "-"}</div>
                              </div>
                              <div className="col-span-2 text-white/75">
                                <div className="truncate">대표: {o.client?.ownerName || "-"}</div>
                                <div className="truncate">☎ {o.client?.receiverTel || "-"} / 📱 {o.client?.receiverMobile || "-"}</div>
                              </div>
                              <div className="col-span-2 text-white/75">
                                <div className="truncate">배송: {o.receiverAddr}</div>
                              </div>
                              <div className="col-span-1 text-right">{o.quantity}</div>
                              <div className="col-span-1">{o.item?.name || "-"}</div>
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