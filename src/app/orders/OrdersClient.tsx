// ✅ src/app/orders/OrdersClient.tsx  (통째로 교체)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "request" | "list" | "clients-list" | "clients-new";

type ClientRow = {
  id: string;
  name: string;
  ownerName?: string | null;
  address?: string | null;
  bizRegNo?: string | null;
  careInstitutionNo?: string | null;
  receiverName?: string | null;
  receiverAddr?: string | null;
  receiverTel?: string | null;
  receiverMobile?: string | null;
  memo?: string | null;
  bizFileUrl?: string | null;
  bizFileName?: string | null;
};

type ItemRow = { id: string; name: string };

type OrderRow = {
  id: string;
  status: string;
  quantity: number;
  createdAt: string;
  receiverName: string;
  receiverAddr: string;
  receiverTel?: string | null;
  receiverMobile?: string | null;
  note?: string | null;
  clientName?: string;
  itemName?: string;
};

function koStatus(s: string) {
  const v = String(s ?? "").toUpperCase();
  if (v === "REQUESTED") return "대기";
  if (v === "APPROVED") return "승인";
  if (v === "REJECTED") return "거절";
  if (v === "DONE") return "완료";
  return v;
}

function fmtDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

export default function OrdersClient({ initialTab }: { initialTab?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((initialTab as Tab) || "request");

  useEffect(() => {
    const t = (sp.get("tab") ?? initialTab ?? "request") as Tab;
    setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  function goto(next: Tab) {
    router.replace(`/orders?tab=${next}`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] px-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex items-start justify-between gap-3 pt-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              주문
            </h1>
            <p className="mt-1 text-sm text-white/60">
              거래처/품목 선택 + 배송정보 입력 후 주문요청
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/15"
          >
            로그아웃
          </button>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <TabBtn active={tab === "request"} onClick={() => goto("request")}>
              주문요청
            </TabBtn>
            <TabBtn active={tab === "list"} onClick={() => goto("list")}>
              조회
            </TabBtn>
            <TabBtn
              active={tab === "clients-list"}
              onClick={() => goto("clients-list")}
            >
              거래처 목록
            </TabBtn>
            <TabBtn
              active={tab === "clients-new"}
              onClick={() => goto("clients-new")}
            >
              거래처 등록
            </TabBtn>
          </div>

          <div className="mt-4">
            {tab === "request" && (
              <RequestPanel onGotoClients={() => goto("clients-list")} />
            )}
            {tab === "list" && <ListPanel />}
            {tab === "clients-list" && (
              <ClientsListPanel onGotoNew={() => goto("clients-new")} />
            )}
            {tab === "clients-new" && (
              <ClientsNewPanel onGotoList={() => goto("clients-list")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: any;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2 text-sm font-bold transition",
        "border border-white/15",
        active
          ? "bg-white text-black"
          : "bg-white/10 text-white/80 hover:bg-white/15",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
      <div className="mb-3 text-lg font-bold text-white">{title}</div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
        {label}{" "}
        {required ? <span className="text-white/60">(필수)</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type ?? "text"}
        className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs font-semibold text-white/60">{label}</div>
      <div className="mt-1 text-sm font-bold text-white break-words">
        {value}
      </div>
    </div>
  );
}

/** ✅ 주문요청 */
function RequestPanel({ onGotoClients }: { onGotoClients: () => void }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [receiverTel, setReceiverTel] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [note, setNote] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const [cr, ir] = await Promise.all([
          fetch("/api/sales/clients", { credentials: "include" }),
          fetch("/api/items", { credentials: "include" }),
        ]);

        const cd = await cr.json().catch(() => ({}));
        const id = await ir.json().catch(() => ({}));

        const cList: any[] = cd?.rows ?? cd?.clients ?? cd?.data ?? [];
        const iList: any[] = id?.rows ?? id?.items ?? id?.data ?? [];

        const mappedClients: ClientRow[] = (Array.isArray(cList) ? cList : []).map(
          (c: any) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            ownerName: c.ownerName ?? null,
            address: c.address ?? null,
            bizRegNo: c.bizRegNo ?? null,
            careInstitutionNo: c.careInstitutionNo ?? null,
            receiverName: c.receiverName ?? null,
            receiverAddr: c.receiverAddr ?? null,
            receiverTel: c.receiverTel ?? null,
            receiverMobile: c.receiverMobile ?? null,
            memo: c.memo ?? null,
            bizFileUrl: c.bizFileUrl ?? null,
            bizFileName: c.bizFileName ?? null,
          })
        );

        const mappedItems: ItemRow[] = (Array.isArray(iList) ? iList : []).map(
          (it: any) => ({ id: String(it.id), name: String(it.name ?? "") })
        );

        if (!mounted) return;
        setClients(mappedClients);
        setItems(mappedItems);

        if (mappedClients[0]?.id) setClientId(mappedClients[0].id);
        if (mappedItems[0]?.id) setItemId(mappedItems[0].id);
      } catch (e: any) {
        if (mounted) setMsg("불러오기 실패(서버 오류)");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setReceiverName(selectedClient.receiverName ?? "");
    setReceiverAddr(selectedClient.receiverAddr ?? "");
    setReceiverTel(selectedClient.receiverTel ?? "");
    setReceiverMobile(selectedClient.receiverMobile ?? "");
    setNote("");
  }, [selectedClient?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setMsg(null);

    if (!clientId) return setMsg("거래처를 선택하세요.");
    if (!itemId) return setMsg("품목을 선택하세요.");
    if (!qty || qty < 1) return setMsg("수량은 1 이상이어야 합니다.");
    if (!receiverName.trim()) return setMsg("수하인명을 입력하세요.");
    if (!receiverAddr.trim()) return setMsg("주소를 입력하세요.");

    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          itemId,
          quantity: qty,
          receiverName,
          receiverAddr,
          receiverTel: receiverTel || null,
          receiverMobile: receiverMobile || null,
          note: note || null,
        }),
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok || d?.ok === false) {
        return setMsg(d?.error || d?.message || "주문요청 실패");
      }

      setMsg("✅ 주문요청 완료!");
      setQty(1);
      setNote("");
    } catch (e: any) {
      setMsg("주문요청 실패(서버 오류)");
    }
  }

  return (
    <Section title="주문요청">
      {msg ? (
        <div className="mb-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85">
          {msg}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-white/60">불러오는 중...</div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
                거래처 선택
              </div>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="text-black">
                    {c.name}
                  </option>
                ))}
              </select>

              {clients.length === 0 ? (
                <button
                  onClick={onGotoClients}
                  className="mt-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/15"
                >
                  거래처가 없습니다 → 거래처 등록하러 가기
                </button>
              ) : null}
            </label>

            <label className="block">
              <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
                품목 선택
              </div>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id} className="text-black">
                    {it.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
                수량
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/15"
                >
                  -
                </button>
                <input
                  value={String(qty)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setQty(Number.isFinite(n) ? Math.max(1, n) : 1);
                  }}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
                />
                <button
                  onClick={() => setQty((v) => v + 1)}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/15"
                >
                  +
                </button>
              </div>
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs font-semibold text-white/60">
                선택 거래처 정보
              </div>
              <div className="mt-1 text-sm text-white/85">
                {selectedClient ? (
                  <>
                    <div className="font-bold">{selectedClient.name}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {selectedClient.address ?? ""}
                    </div>
                  </>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="수하인"
              value={receiverName}
              onChange={setReceiverName}
              placeholder="예: 홍길동"
              required
            />
            <Input
              label="주소"
              value={receiverAddr}
              onChange={setReceiverAddr}
              placeholder="예: 경기도 안산시 ..."
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="전화"
              value={receiverTel}
              onChange={setReceiverTel}
              placeholder="예: 031-000-0000"
            />
            <Input
              label="휴대폰"
              value={receiverMobile}
              onChange={setReceiverMobile}
              placeholder="예: 010-0000-0000"
            />
          </div>

          <Textarea
            label="주문 요청(메모)"
            value={note}
            onChange={setNote}
            placeholder="요청사항을 입력하세요"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={submit}
              className="rounded-2xl border border-white/15 bg-white text-black px-5 py-3 text-sm font-bold hover:bg-white/90"
            >
              주문 요청
            </button>
            <button
              onClick={() => {
                setQty(1);
                setNote("");
              }}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/15"
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

/** ✅ 조회 */
function ListPanel() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const r = await fetch("/api/orders", { credentials: "include" });
        const d = await r.json().catch(() => ({}));

        const list: any[] =
          d?.orders ?? d?.rows ?? d?.data ?? (Array.isArray(d) ? d : []);

        const mapped: OrderRow[] = (Array.isArray(list) ? list : []).map(
          (o: any) => ({
            id: String(o.id),
            status: String(o.status ?? ""),
            quantity: Number(o.quantity ?? 0),
            createdAt: String(o.createdAt ?? ""),
            receiverName: String(o.receiverName ?? ""),
            receiverAddr: String(o.receiverAddr ?? ""),
            receiverTel: o.receiverTel ?? null,
            receiverMobile: o.receiverMobile ?? null,
            note: o.note ?? null,
            clientName: o.client?.name ?? o.clientName ?? "",
            itemName: o.item?.name ?? o.itemName ?? "",
          })
        );

        if (mounted) setRows(mapped);
      } catch (e: any) {
        if (mounted) setMsg("조회 실패(서버 오류)");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Section title={`조회 (${rows.length})`}>
      {msg ? <div className="mb-3 text-sm text-white/70">{msg}</div> : null}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-0 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/70">
          <div className="col-span-2">일자</div>
          <div className="col-span-2">상태</div>
          <div className="col-span-3">거래처</div>
          <div className="col-span-3">품목</div>
          <div className="col-span-1 text-right">수량</div>
          <div className="col-span-1"></div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-white/60">불러오는 중...</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-sm text-white/60">
            조회 결과가 없습니다.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-12 gap-0 border-b border-white/10 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
            >
              <div className="col-span-2 text-white/70">{fmtDate(r.createdAt)}</div>
              <div className="col-span-2 font-bold">{koStatus(r.status)}</div>
              <div className="col-span-3 truncate">{r.clientName || "-"}</div>
              <div className="col-span-3 truncate">{r.itemName || "-"}</div>
              <div className="col-span-1 text-right font-bold">
                {r.quantity}
              </div>
              <div className="col-span-1 text-right">
                <span className="text-xs text-white/40">{r.id.slice(0, 6)}</span>
              </div>

              <div className="col-span-12 mt-2 text-xs text-white/60">
                <span className="font-semibold text-white/70">수하인:</span>{" "}
                {r.receiverName} /{" "}
                <span className="font-semibold text-white/70">주소:</span>{" "}
                {r.receiverAddr}
              </div>
            </div>
          ))
        )}
      </div>
    </Section>
  );
}

/** ✅ 거래처 목록 */
function ClientsListPanel({ onGotoNew }: { onGotoNew: () => void }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [sel, setSel] = useState<ClientRow | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/sales/clients", { credentials: "include" });
        const d = await r.json().catch(() => ({}));
        const list: any[] = d?.rows ?? d?.clients ?? d?.data ?? [];

        const mapped: ClientRow[] = (Array.isArray(list) ? list : []).map(
          (c: any) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            ownerName: c.ownerName ?? null,
            address: c.address ?? null,
            bizRegNo: c.bizRegNo ?? null,
            careInstitutionNo: c.careInstitutionNo ?? null,
            receiverName: c.receiverName ?? null,
            receiverAddr: c.receiverAddr ?? null,
            receiverTel: c.receiverTel ?? null,
            receiverMobile: c.receiverMobile ?? null,
            memo: c.memo ?? null,
            bizFileUrl: c.bizFileUrl ?? null,
            bizFileName: c.bizFileName ?? null,
          })
        );

        if (!mounted) return;
        setRows(mapped);
        setSel(mapped[0] ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((c) => {
      const hay = [
        c.name,
        c.ownerName ?? "",
        c.address ?? "",
        c.bizRegNo ?? "",
        c.careInstitutionNo ?? "",
        c.receiverName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q]);

  function openBizfile(download: boolean) {
    if (!sel) return;
    const url = `/api/sales/clients/${sel.id}/bizfile${download ? "?download=1" : ""}`;
    window.open(url, "_blank");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title={`거래처 목록${loading ? "" : ` (${filtered.length})`}`}>
        <div className="mb-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="거래처명/대표자/주소/사업자번호/요양기관번호"
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
          />
          <button
            onClick={onGotoNew}
            className="whitespace-nowrap rounded-2xl border border-white/15 bg-white text-black px-4 py-3 text-sm font-bold hover:bg-white/90"
          >
            등록
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSel(c)}
              className={[
                "w-full text-left px-4 py-3 border-b border-white/10 transition",
                "hover:bg-white/10",
                sel?.id === c.id ? "bg-white/10" : "bg-transparent",
              ].join(" ")}
            >
              <div className="font-bold text-white">{c.name}</div>
              <div className="mt-0.5 text-xs text-white/55">
                {(c.address ?? "") || (c.ownerName ?? "")}
              </div>
            </button>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="px-4 py-8 text-sm text-white/60">
              거래처가 없습니다.
            </div>
          )}
          {loading && (
            <div className="px-4 py-8 text-sm text-white/60">
              불러오는 중...
            </div>
          )}
        </div>
      </Section>

      <Section title="상세">
        {!sel ? (
          <div className="text-sm text-white/60">
            왼쪽에서 거래처를 선택하세요.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-white">{sel.name}</div>
              <div className="mt-1 text-sm text-white/60">
                {sel.address ?? ""}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="대표자(원장)명" value={sel.ownerName ?? "-"} />
              <Info label="사업자번호" value={sel.bizRegNo ?? "-"} />
              <Info label="요양기관번호" value={sel.careInstitutionNo ?? "-"} />
              <Info label="수하인명" value={sel.receiverName ?? "-"} />
              <Info label="수하인 전화" value={sel.receiverTel ?? "-"} />
              <Info label="수하인 핸드폰" value={sel.receiverMobile ?? "-"} />
              <Info label="메모" value={sel.memo ?? "-"} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs font-semibold text-white/60">
                사업자등록증
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="text-sm font-bold text-white/85">
                  {sel.bizFileName ?? "없음"}
                </div>

                <button
                  onClick={() => openBizfile(false)}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/80 hover:bg-white/15"
                >
                  보기
                </button>

                <button
                  onClick={() => openBizfile(true)}
                  className="rounded-2xl border border-white/15 bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                >
                  다운로드
                </button>

                <div className="text-xs text-white/45">
                  (없으면 NO_BIZFILE 뜨는 게 정상)
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

/** ✅ 거래처 등록 */
function ClientsNewPanel({ onGotoList }: { onGotoList: () => void }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [bizRegNo, setBizRegNo] = useState("");
  const [careInstitutionNo, setCareInstitutionNo] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [receiverTel, setReceiverTel] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [memo, setMemo] = useState("");

  const [file, setFile] = useState<File | null>(null);

  async function save() {
    setMsg(null);
    if (!name.trim()) return setMsg("거래처명은 필수입니다.");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("ownerName", ownerName);
      fd.set("address", address);
      fd.set("bizRegNo", bizRegNo);
      fd.set("careInstitutionNo", careInstitutionNo);

      fd.set("receiverName", receiverName);
      fd.set("receiverAddr", receiverAddr);
      fd.set("receiverTel", receiverTel);
      fd.set("receiverMobile", receiverMobile);

      fd.set("memo", memo);
      if (file) fd.set("bizfile", file);

      const r = await fetch("/api/sales/clients", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok || d?.ok === false) {
        setMsg(d?.error || d?.message || "저장 실패");
      } else {
        setMsg("✅ 저장 완료!");
        onGotoList();
      }
    } catch (e: any) {
      setMsg("저장 실패(서버 오류)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="거래처 등록">
      {msg ? (
        <div className="mb-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85">
          {msg}
        </div>
      ) : null}

      <div className="grid gap-4">
        <Input
          label="거래처명"
          value={name}
          onChange={setName}
          placeholder="예: 한한한의원"
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="대표자(원장)명"
            value={ownerName}
            onChange={setOwnerName}
            placeholder="예: 홍길동"
          />
          <Input
            label="요양기관번호"
            value={careInstitutionNo}
            onChange={setCareInstitutionNo}
            placeholder="예: 1234567890"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="사업자번호"
            value={bizRegNo}
            onChange={setBizRegNo}
            placeholder="예: 123-45-67890"
          />
          <Input
            label="주소"
            value={address}
            onChange={setAddress}
            placeholder="예: 경기도 안산시 ..."
          />
        </div>

        <Input
          label="수하인명"
          value={receiverName}
          onChange={setReceiverName}
          placeholder="예: 한한양"
        />

        <Input
          label="수하인 주소"
          value={receiverAddr}
          onChange={setReceiverAddr}
          placeholder="예: 경기도 안산시 한한동"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="수하인 전화"
            value={receiverTel}
            onChange={setReceiverTel}
            placeholder="예: 031-000-0000"
          />
          <Input
            label="수하인 핸드폰"
            value={receiverMobile}
            onChange={setReceiverMobile}
            placeholder="예: 010-0000-0000"
          />
        </div>

        <Textarea
          label="메모"
          value={memo}
          onChange={setMemo}
          placeholder="메모를 입력하세요"
        />

        <label className="block">
          <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
            사업자등록증 첨부
          </div>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white"
          />
          <div className="mt-1 text-xs text-white/45">
            권장: 5MB 이하 / PDF 또는 이미지
          </div>
        </label>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-2xl border border-white/15 bg-white text-black px-5 py-3 text-sm font-bold hover:bg-white/90 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "거래처 저장"}
          </button>

          <button
            onClick={onGotoList}
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/15"
          >
            목록으로
          </button>
        </div>
      </div>
    </Section>
  );
}