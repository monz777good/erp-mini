"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "request" | "list" | "clients-list" | "clients-new";

type ClientRow = {
  id: string;
  name: string;
  owner?: string | null;
  bizNo?: string | null;
  ykiho?: string | null;
  addr?: string | null;
  phone?: string | null;
  mobile?: string | null;
  note?: string | null;
  bizFileName?: string | null;
  bizFileMime?: string | null;
  createdAt?: string;
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

export default function OrdersClient({ initialTab }: { initialTab: string }) {
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
    <div className="min-h-[calc(100dvh-64px)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">주문</h1>
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
          {tab === "request" && <RequestPanel />}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
        {label}
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

/** =====================
 *  주문요청 (지금은 너가 원래 쓰던 로직 붙일 자리)
 *  ===================== */
function RequestPanel() {
  return (
    <Section title="주문요청">
      <div className="text-sm text-white/70">
        여기 “주문요청 폼(거래처/품목/수량/배송정보)”을 원래 코드로 복구해서 붙이면 됨.
      </div>
    </Section>
  );
}

/** =====================
 *  ✅ 조회: 주문 테이블 “진짜로 붙임”
 *  ===================== */
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
            phone: o.phone ?? null,
            mobile: o.mobile ?? null,
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
    <Section title="조회">
      {msg && (
        <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {msg}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 bg-white/5 px-4 py-3 text-xs font-bold text-white/70">
          <div className="col-span-2">상태</div>
          <div className="col-span-2">수량</div>
          <div className="col-span-3">거래처</div>
          <div className="col-span-3">수령인</div>
          <div className="col-span-2">주문일</div>
        </div>

        {loading && (
          <div className="px-4 py-10 text-sm text-white/60">불러오는 중...</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="px-4 py-10 text-sm text-white/60">
            주문이 없습니다.
          </div>
        )}

        {!loading &&
          rows.map((o) => (
            <div
              key={o.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-white/85 border-t border-white/10"
            >
              <div className="col-span-2 font-bold">{koStatus(o.status)}</div>
              <div className="col-span-2">{o.quantity}</div>
              <div className="col-span-3 truncate">{o.clientName || "-"}</div>
              <div className="col-span-3 truncate">
                {o.receiverName} / {o.receiverAddr}
              </div>
              <div className="col-span-2 text-white/60 truncate">
                {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
              </div>

              {o.note ? (
                <div className="col-span-12 mt-1 text-xs text-white/55">
                  메모: {o.note}
                </div>
              ) : null}
            </div>
          ))}
      </div>
    </Section>
  );
}

/** =====================
 *  ✅ 거래처 목록 + 우측 상세(등록 정보 전부)
 *  ===================== */
function ClientsListPanel({ onGotoNew }: { onGotoNew: () => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [sel, setSel] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/sales/clients", { credentials: "include" });
        const d = await r.json().catch(() => ({}));
        const list: ClientRow[] =
          d?.clients ?? d?.rows ?? d?.data ?? (Array.isArray(d) ? d : []);
        if (mounted) {
          setRows(Array.isArray(list) ? list : []);
          setSel(Array.isArray(list) && list.length ? list[0] : null);
        }
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return rows;
    return rows.filter((c) => {
      const t = `${c.name ?? ""} ${c.owner ?? ""} ${c.addr ?? ""} ${c.bizNo ?? ""} ${c.ykiho ?? ""} ${c.phone ?? ""} ${c.mobile ?? ""} ${c.note ?? ""}`;
      return t.includes(s);
    });
  }, [q, rows]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title={`거래처 목록 ${loading ? "" : `(${filtered.length})`}`}>
        <div className="mb-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="거래처명/수하인/주소/대표자/사업자번호/요양기관번호"
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
                {c.addr || c.owner || ""}
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
                {sel.addr ?? ""}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="사업자번호" value={sel.bizNo ?? "-"} />
              <Info label="요양기관번호" value={sel.ykiho ?? "-"} />
              <Info label="수하인명" value={sel.owner ?? "-"} />
              <Info label="수하인 전화" value={sel.phone ?? "-"} />
              <Info label="수하인 핸드폰" value={sel.mobile ?? "-"} />
              <Info label="메모" value={sel.note ?? "-"} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs font-semibold text-white/60">
                사업자등록증
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {sel.bizFileName ? (
                  <>
                    <div className="text-sm font-bold text-white">
                      {sel.bizFileName}
                    </div>
                    <a
                      className="rounded-xl border border-white/15 bg-white text-black px-3 py-2 text-xs font-bold hover:bg-white/90"
                      href={`/api/sales/clients/${sel.id}/bizfile`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      보기/다운로드
                    </a>
                  </>
                ) : (
                  <div className="text-sm text-white/60">첨부 없음</div>
                )}
              </div>
            </div>

            <button className="mt-2 w-full rounded-2xl border border-white/15 bg-white text-black px-4 py-3 text-sm font-bold hover:bg-white/90">
              이 거래처로 주문하기
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}

/** =====================
 *  ✅ 거래처 등록 + 사업자등록증 첨부
 *  ===================== */
function ClientsNewPanel({ onGotoList }: { onGotoList: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [ykiho, setYkiho] = useState("");
  const [owner, setOwner] = useState("");
  const [addr, setAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");

  const [bizFileName, setBizFileName] = useState<string | null>(null);
  const [bizFileMime, setBizFileMime] = useState<string | null>(null);
  const [bizFileData, setBizFileData] = useState<string | null>(null);

  async function onPickFile(file: File | null) {
    setMsg(null);
    if (!file) {
      setBizFileName(null);
      setBizFileMime(null);
      setBizFileData(null);
      return;
    }

    // ✅ 너무 큰 파일 방지(대략 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMsg("파일이 너무 큽니다. (5MB 이하 권장)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setBizFileName(file.name);
        setBizFileMime(file.type || "application/octet-stream");
        setBizFileData(result); // dataURL
      }
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!name.trim()) {
      setMsg("거래처명(필수)을 입력하세요.");
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/sales/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          bizNo,
          ykiho,
          owner,
          addr,
          phone,
          mobile,
          note,
          bizFileName,
          bizFileMime,
          bizFileData,
        }),
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d?.ok) {
        setMsg(d?.error ?? "저장 실패");
        setLoading(false);
        return;
      }

      onGotoList();
    } catch {
      setMsg("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section title="거래처 등록">
      <div className="space-y-4">
        <Input
          label="거래처명(필수)"
          value={name}
          onChange={setName}
          placeholder="예: 한한한의원"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="사업자번호" value={bizNo} onChange={setBizNo} />
          <Input label="요양기관번호" value={ykiho} onChange={setYkiho} />
        </div>

        <Input label="수하인명" value={owner} onChange={setOwner} />
        <Input label="수하인 주소" value={addr} onChange={setAddr} />

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="수하인 전화" value={phone} onChange={setPhone} />
          <Input label="수하인 핸드폰" value={mobile} onChange={setMobile} />
        </div>

        <Input label="메모" value={note} onChange={setNote} />

        {/* ✅ 사업자등록증 첨부 */}
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
          <div className="mb-2 text-xs font-semibold tracking-wide text-white/70">
            사업자등록증 첨부
          </div>

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-white/70"
          />

          <div className="mt-2 text-xs text-white/50">
            권장: 5MB 이하 / PDF 또는 이미지
          </div>

          {bizFileName && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              첨부됨: <span className="font-bold">{bizFileName}</span>
            </div>
          )}
        </div>

        {msg && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {msg}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={loading || !name.trim()}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-bold transition",
              "border border-white/15",
              loading || !name.trim()
                ? "bg-white/20 text-white/60"
                : "bg-white text-black hover:bg-white/90",
            ].join(" ")}
          >
            {loading ? "저장 중..." : "거래처 저장"}
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