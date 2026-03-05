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
};

export default function OrdersClient({ initialTab }: { initialTab: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [tab, setTab] = useState<Tab>(
    (initialTab as Tab) || "request"
  );

  // ✅ URL(tab=...) 동기화
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
      {/* 상단 바 */}
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

      {/* 탭 카드 */}
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
          {tab === "clients-list" && <ClientsListPanel onGotoNew={() => goto("clients-new")} />}
          {tab === "clients-new" && <ClientsNewPanel onGotoList={() => goto("clients-list")} />}
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
        active ? "bg-white text-black" : "bg-white/10 text-white/80 hover:bg-white/15",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** =====================
 *  주문요청(일단 UI만)
 *  ===================== */
function RequestPanel() {
  return (
    <Section title="주문요청">
      <div className="text-sm text-white/70">
        여기 “주문요청 폼(거래처/품목/수량/배송정보)” 붙이면 됨.
        <div className="mt-2 text-white/45">
          (지금은 UI 복구 먼저라서 빈 패널로 둠)
        </div>
      </div>
    </Section>
  );
}

/** =====================
 *  조회(일단 UI만)
 *  ===================== */
function ListPanel() {
  return (
    <Section title="조회">
      <div className="text-sm text-white/70">
        여기 “주문 조회 테이블” 붙이면 됨.
      </div>
    </Section>
  );
}

/** =====================
 *  거래처 목록
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
        // ✅ 네 프로젝트에 이미 있는 /api/sales/clients 를 기대
        const r = await fetch("/api/sales/clients", { credentials: "include" });
        const d = await r.json().catch(() => ({}));

        const list: ClientRow[] =
          d?.clients ??
          d?.rows ??
          d?.data ??
          (Array.isArray(d) ? d : []);

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
      const t = `${c.name ?? ""} ${c.owner ?? ""} ${c.addr ?? ""} ${c.bizNo ?? ""} ${c.ykiho ?? ""}`;
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
            <div className="px-4 py-8 text-sm text-white/60">거래처가 없습니다.</div>
          )}
          {loading && (
            <div className="px-4 py-8 text-sm text-white/60">불러오는 중...</div>
          )}
        </div>
      </Section>

      <Section title="상세">
        {!sel ? (
          <div className="text-sm text-white/60">왼쪽에서 거래처를 선택하세요.</div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-white">{sel.name}</div>
              <div className="mt-1 text-sm text-white/60">{sel.addr ?? ""}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="사업자번호" value={sel.bizNo ?? "-"} />
              <Info label="요양기관번호" value={sel.ykiho ?? "-"} />
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
 *  거래처 등록
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

  async function save() {
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
        <Input label="거래처명(필수)" value={name} onChange={setName} placeholder="예: 한한한의원" />
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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs font-semibold text-white/60">{label}</div>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}