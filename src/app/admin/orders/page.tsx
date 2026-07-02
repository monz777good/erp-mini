"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "REQUESTED" | "APPROVED" | "REJECTED" | "DONE";
type AccountKey = "hana" | "ibk" | "kb";
type StatementFilter = "ALL" | "Y" | "N" | AccountKey;

type ItemLine = {
  itemId?: string;
  itemName?: string;
  quantity?: number;
  price?: number;
  amount?: number;
};

type Row = {
  id: string;
  orderIds?: string[];
  createdAt: string;
  status: Status;
  salesName: string;
  salesPhone: string;
  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;
  clientName: string;
  careInstitutionNo?: string | null;
  note?: string | null;
  specYN?: string | null;
  statementAccount?: string | null;
  itemName: string;
  quantityText: string;
  items?: ItemLine[];
};

const STATUS_LABEL: Record<Status, string> = {
  REQUESTED: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
  DONE: "출고완료",
};

const ACCOUNT_OPTIONS: { value: AccountKey; label: string }[] = [
  { value: "hana", label: "하나은행 871-910010-06204 송영준" },
  { value: "ibk", label: "기업은행 106-054551-04019 송영준" },
  { value: "kb", label: "국민은행 202602-04-157713 송영준" },
];

const STATEMENT_FILTER_LABEL: Record<StatementFilter, string> = {
  ALL: "명세서 전체",
  Y: "Y 전체",
  N: "N만 보기",
  hana: "하나은행",
  ibk: "기업은행",
  kb: "국민은행",
};

function kstTodayYmd() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

function addDaysYmd(ymd: string, delta: number) {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(dt);
}

function formatKst(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso || "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function monthKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

function qtyTotal(row: Row) {
  if (Array.isArray(row.items) && row.items.length > 0) {
    return row.items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity ?? 0) || 0), 0);
  }

  const matches: string[] = String(row.quantityText ?? "").match(/\d+/g) ?? [];
  return matches.reduce((sum, value) => sum + Number(value), 0);
}

function itemLines(row: Row) {
  if (Array.isArray(row.items) && row.items.length > 0) {
    return row.items.map((item) => {
      const quantity = Math.max(1, Number(item.quantity ?? 1) || 1);
      const price = Math.max(0, Number(item.price ?? 0) || 0);
      const amount = Math.max(0, Number(item.amount ?? quantity * price) || 0);

      return {
        name: item.itemName || "-",
        quantity,
        price,
        amount,
      };
    });
  }

  const names = String(row.itemName ?? "-").split("\n");
  const qtys = String(row.quantityText ?? "")
    .split("\n")
    .map((value) => Number(String(value).replace(/[^\d]/g, "")) || 1);

  return names.map((name, index) => ({
    name: name || "-",
    quantity: qtys[index] ?? 1,
    price: 0,
    amount: 0,
  }));
}

function amountTotal(row: Row) {
  return itemLines(row).reduce((sum, item) => sum + item.amount, 0);
}

function money(value: number) {
  return `${Math.round(value || 0).toLocaleString("ko-KR")}원`;
}

function cls(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function isAccountKey(value: string): value is AccountKey {
  return value === "hana" || value === "ibk" || value === "kb";
}

function statementAccountLabel(value: unknown) {
  const found = ACCOUNT_OPTIONS.find((option) => option.value === value);
  return found?.label ?? "계좌 미지정";
}

function statementAccountShortLabel(value: unknown) {
  if (value === "hana") return "하나은행";
  if (value === "ibk") return "기업은행";
  if (value === "kb") return "국민은행";
  return "미지정";
}

function statementDisplay(row: Row) {
  if (row.specYN !== "Y") return "N";
  return `Y · ${statementAccountLabel(row.statementAccount)}`;
}

function statementBadge(row: Row, selected: boolean, onToggle: () => void) {
  if (row.specYN !== "Y") {
    return (
      <span className="inline-flex h-8 min-w-[52px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-500">
        N
      </span>
    );
  }

  const isMissing = !row.statementAccount;

  return (
    <label
      title={statementAccountLabel(row.statementAccount)}
      className={cls(
        "inline-flex h-9 max-w-[150px] items-center gap-2 rounded-full border px-2.5 text-xs font-black",
        isMissing
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      )}
    >
      <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 shrink-0" />
      <span
        className={cls(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] text-white",
          isMissing ? "bg-amber-500" : "bg-emerald-600"
        )}
      >
        Y
      </span>
      <span className="min-w-0 truncate">{statementAccountShortLabel(row.statementAccount)}</span>
    </label>
  );
}

export default function AdminOrdersPage() {
  const today = useMemo(() => kstTodayYmd(), []);

  const [tab, setTab] = useState<Status>("REQUESTED");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");
  const [statementFilter, setStatementFilter] = useState<StatementFilter>("ALL");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [summaryRows, setSummaryRows] = useState<Row[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const [selectedStatementIds, setSelectedStatementIds] = useState<string[]>([]);

  const load = useCallback(
    async (silent = false) => {
      if (!from || !to) return;
      if (!silent) setLoading(true);
      setMsg(null);

      try {
        const params = new URLSearchParams();
        params.set("status", tab);
        params.set("from", from);
        params.set("to", to);
        if (q.trim()) params.set("q", q.trim());

        const summaryParams = new URLSearchParams();
        summaryParams.set("from", from);
        summaryParams.set("to", to);
        if (q.trim()) summaryParams.set("q", q.trim());

        const [res, summaryRes] = await Promise.all([
          fetch(`/api/admin/orders?${params.toString()}`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`/api/admin/orders?${summaryParams.toString()}`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const data = await res.json().catch(() => ({}));
        const summaryData = await summaryRes.json().catch(() => ({}));

        if (!res.ok || data?.ok === false) {
          throw new Error(data?.message || data?.error || `HTTP_${res.status}`);
        }
        if (!summaryRes.ok || summaryData?.ok === false) {
          throw new Error(summaryData?.message || summaryData?.error || `HTTP_${summaryRes.status}`);
        }

        const nextRows = Array.isArray(data.rows) ? data.rows : [];
        const nextSummaryRows = Array.isArray(summaryData.rows) ? summaryData.rows : [];
        setRows(nextRows);
        setSummaryRows(nextSummaryRows);
        setSelectedStatementIds((prev) =>
          prev.filter((id) => nextRows.some((row: Row) => row.id === id && row.specYN === "Y"))
        );
        setLastUpdatedAt(new Date());
      } catch (e: any) {
        if (!silent) {
          setMsg(e?.message || "주문 조회에 실패했습니다.");
          setRows([]);
          setSummaryRows([]);
          setSelectedStatementIds([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [from, q, tab, to]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(false);
    }, q.trim() ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [load, q]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load(true);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [load]);

  const visibleRows = useMemo(() => {
    if (statementFilter === "Y") return rows.filter((row) => row.specYN === "Y");
    if (statementFilter === "N") return rows.filter((row) => row.specYN !== "Y");
    if (isAccountKey(statementFilter)) {
      return rows.filter((row) => row.specYN === "Y" && row.statementAccount === statementFilter);
    }
    return rows;
  }, [rows, statementFilter]);

  const statementRows = useMemo(() => visibleRows.filter((row) => row.specYN === "Y"), [visibleRows]);
  const nonStatementRows = useMemo(() => visibleRows.filter((row) => row.specYN !== "Y"), [visibleRows]);
  const summaryStatementRows = useMemo(
    () => summaryRows.filter((row) => row.specYN === "Y"),
    [summaryRows]
  );
  const allStatementSelected =
    statementRows.length > 0 && statementRows.every((row) => selectedStatementIds.includes(row.id));

  const totalQty = useMemo(() => visibleRows.reduce((sum, row) => sum + qtyTotal(row), 0), [visibleRows]);

  useEffect(() => {
    setSelectedStatementIds((prev) => {
      const next = prev.filter((id) => statementRows.some((row) => row.id === id));
      return next.length === prev.length ? prev : next;
    });
  }, [statementRows]);

  const dealerStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; qty: number; amount: number; items: Map<string, { qty: number; amount: number }> }
    >();

    for (const row of summaryRows) {
      const key = row.salesName || "미지정";
      const prev = map.get(key) ?? {
        name: key,
        count: 0,
        qty: 0,
        amount: 0,
        items: new Map<string, { qty: number; amount: number }>(),
      };
      prev.count += 1;
      prev.qty += qtyTotal(row);
      prev.amount += amountTotal(row);
      for (const item of itemLines(row)) {
        const prevItem = prev.items.get(item.name) ?? { qty: 0, amount: 0 };
        prevItem.qty += item.quantity;
        prevItem.amount += item.amount;
        prev.items.set(item.name, prevItem);
      }
      map.set(key, prev);
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        itemList: Array.from(item.items.entries())
          .map(([name, data]) => ({ name, qty: data.qty, amount: data.amount }))
          .sort((a, b) => b.amount - a.amount || b.qty - a.qty)
          .slice(0, 4),
      }))
      .sort((a, b) => b.amount - a.amount || b.count - a.count)
      .slice(0, 6);
  }, [summaryRows]);

  const monthStats = useMemo(() => {
    const map = new Map<
      string,
      { month: string; count: number; qty: number; amount: number; items: Map<string, { qty: number; amount: number }> }
    >();

    for (const row of summaryRows) {
      const key = monthKey(row.createdAt);
      const prev = map.get(key) ?? {
        month: key,
        count: 0,
        qty: 0,
        amount: 0,
        items: new Map<string, { qty: number; amount: number }>(),
      };
      prev.count += 1;
      prev.qty += qtyTotal(row);
      prev.amount += amountTotal(row);
      for (const item of itemLines(row)) {
        const prevItem = prev.items.get(item.name) ?? { qty: 0, amount: 0 };
        prevItem.qty += item.quantity;
        prevItem.amount += item.amount;
        prev.items.set(item.name, prevItem);
      }
      map.set(key, prev);
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        itemList: Array.from(item.items.entries())
          .map(([name, data]) => ({ name, qty: data.qty, amount: data.amount }))
          .sort((a, b) => b.amount - a.amount || b.qty - a.qty)
          .slice(0, 4),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [summaryRows]);

  const dealerMonthStats = useMemo(() => {
    const map = new Map<
      string,
      {
        month: string;
        dealer: string;
        count: number;
        qty: number;
        amount: number;
        items: Map<string, { qty: number; amount: number }>;
      }
    >();

    for (const row of summaryRows) {
      const month = monthKey(row.createdAt);
      const dealer = row.salesName || "미지정";
      const key = `${month}|${dealer}`;
      const prev = map.get(key) ?? {
        month,
        dealer,
        count: 0,
        qty: 0,
        amount: 0,
        items: new Map<string, { qty: number; amount: number }>(),
      };

      prev.count += 1;
      prev.qty += qtyTotal(row);
      prev.amount += amountTotal(row);

      for (const item of itemLines(row)) {
        const prevItem = prev.items.get(item.name) ?? { qty: 0, amount: 0 };
        prevItem.qty += item.quantity;
        prevItem.amount += item.amount;
        prev.items.set(item.name, prevItem);
      }

      map.set(key, prev);
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        itemList: Array.from(item.items.entries())
          .map(([name, data]) => ({ name, qty: data.qty, amount: data.amount }))
          .sort((a, b) => b.amount - a.amount || b.qty - a.qty),
      }))
      .sort((a, b) => b.month.localeCompare(a.month) || b.amount - a.amount || b.count - a.count);
  }, [summaryRows]);

  async function setStatus(id: string, next: Status) {
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.error || `HTTP_${res.status}`);
      }

      await load(true);
    } catch (e: any) {
      alert(`상태 변경 실패\n${e?.message || ""}`);
    }
  }

  async function exportLozen() {
    setMsg(null);

    try {
      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);

      const res = await fetch(`/api/admin/lozen/export?${params.toString()}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `HTTP_${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lozen_${from}_${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      await load(true);
    } catch (e: any) {
      alert(`로젠 출력 실패\n${e?.message || "NETWORK_ERROR"}`);
    }
  }

  function toggleStatementId(id: string) {
    setSelectedStatementIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }

  function toggleAllStatements() {
    setSelectedStatementIds(allStatementSelected ? [] : statementRows.map((row) => row.id));
  }

  function openAllVisibleStatements() {
    openStatements(statementRows.map((row) => row.id));
  }

  function openStatements(ids: string[]) {
    if (ids.length === 0) {
      alert("출력할 거래명세서를 선택해주세요.");
      return;
    }

    const url = `/statement-print?ids=${encodeURIComponent(ids.join(","))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function quickRange(days: number) {
    const end = kstTodayYmd();
    setTo(end);
    setFrom(addDaysYmd(end, -days + 1));
  }

  const statusButton = (status: Status) =>
    cls(
      "h-11 rounded-full border px-4 text-sm font-black transition",
      tab === status
        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
        : "border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
    );

  const inputClass =
    "h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-bold text-slate-900 outline-none";
  const secondaryButton =
    "h-11 min-w-[64px] whitespace-nowrap rounded-xl border border-emerald-100 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50";
  const primaryButton =
    "h-11 min-w-[64px] whitespace-nowrap rounded-xl border border-emerald-600 bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60";
  const dangerButton =
    "h-11 min-w-[64px] whitespace-nowrap rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100";

  return (
    <main className="space-y-5">
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              관리자 주문 관리
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-600">
              새 주문은 자동으로 갱신됩니다. 태블릿에서는 카드 보기로 포장 정보를 크게 볼 수 있습니다.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-extrabold text-slate-700">
            마지막 갱신: {lastUpdatedAt ? formatKst(lastUpdatedAt.toISOString()) : "-"}
          </div>
        </div>
      </section>

      {msg ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700">
          {msg}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">주문건</div>
          <div className="mt-2 text-3xl font-black text-slate-950">{visibleRows.length.toLocaleString("ko-KR")}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">{STATUS_LABEL[tab]} · {STATEMENT_FILTER_LABEL[statementFilter]}</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">총 수량</div>
          <div className="mt-2 text-3xl font-black text-emerald-700">{totalQty.toLocaleString("ko-KR")}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">포장해야 할 제품 수량</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">명세서 Y</div>
          <div className="mt-2 text-3xl font-black text-slate-950">
            {summaryStatementRows.length.toLocaleString("ko-KR")}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500">기간 전체 기준</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">자동 갱신</div>
          <div className="mt-2 text-3xl font-black text-slate-950">10초</div>
          <div className="mt-1 text-xs font-bold text-slate-500">조회 버튼 없이 반영</div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {(["REQUESTED", "APPROVED", "REJECTED", "DONE"] as Status[]).map((status) => (
              <button
                key={status}
                className={statusButton(status)}
                onClick={() => {
                  setTab(status);
                  setSelectedStatementIds([]);
                }}
              >
                {STATUS_LABEL[status]}
              </button>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {(["ALL", "N", "Y", "hana", "ibk", "kb"] as StatementFilter[]).map((filter) => (
              <button
                key={filter}
                className={cls(
                  "h-10 rounded-full border px-4 text-sm font-black transition",
                  statementFilter === filter
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                )}
                onClick={() => setStatementFilter(filter)}
              >
                {STATEMENT_FILTER_LABEL[filter]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[160px_160px_1fr_auto]">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="품목, 수하인, 거래처, 요양기관, 영업사원, 전화, 비고 검색"
              className={inputClass}
            />
            <button onClick={() => void load(false)} className={secondaryButton} disabled={loading}>
              {loading ? "갱신중" : "지금 새로고침"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button className={secondaryButton} onClick={() => quickRange(1)}>
              오늘
            </button>
            <button className={secondaryButton} onClick={() => quickRange(7)}>
              최근 7일
            </button>
            <button className={secondaryButton} onClick={() => quickRange(31)}>
              최근 31일
            </button>
            {tab === "APPROVED" ? (
              <button className={primaryButton} onClick={exportLozen}>
                로젠 출력
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-black text-slate-900">딜러별 주문</div>
            <div className="space-y-2">
              {dealerStats.length === 0 ? (
                <div className="text-sm font-bold text-slate-500">데이터 없음</div>
              ) : (
                dealerStats.map((item) => (
                  <div key={item.name} className="rounded-xl bg-emerald-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 truncate text-sm font-extrabold text-slate-800">{item.name}</div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black text-emerald-700">
                          {item.count}건 · {item.qty}개
                        </div>
                        <div className="text-[11px] font-black text-slate-700">{money(item.amount)}</div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs font-bold leading-relaxed text-slate-600">
                      {item.itemList.length > 0
                        ? item.itemList.map((line) => `${line.name} x${line.qty} · ${money(line.amount)}`).join(" / ")
                        : "품목 없음"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-black text-slate-900">월별 주문</div>
            <div className="space-y-2">
              {monthStats.length === 0 ? (
                <div className="text-sm font-bold text-slate-500">데이터 없음</div>
              ) : (
                monthStats.map((item) => (
                  <div key={item.month} className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-extrabold text-slate-800">{item.month}</div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-700">
                          {item.count}건 · {item.qty}개
                        </div>
                        <div className="text-[11px] font-black text-emerald-700">{money(item.amount)}</div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs font-bold leading-relaxed text-slate-600">
                      {item.itemList.length > 0
                        ? item.itemList.map((line) => `${line.name} x${line.qty} · ${money(line.amount)}`).join(" / ")
                        : "품목 없음"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-black text-slate-950">딜러 월별 데이터</div>
            <div className="mt-1 text-xs font-bold text-slate-500">기간 안의 전체 상태 주문을 딜러와 월별로 합산합니다.</div>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
            {dealerMonthStats.length}개 그룹
          </div>
        </div>
        {dealerMonthStats.length === 0 ? (
          <div className="py-6 text-center text-sm font-bold text-slate-500">데이터 없음</div>
        ) : (
          <div className="-mx-1 max-h-[420px] overflow-auto px-1">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs text-slate-500">
                <tr className="border-b border-emerald-100">
                  <th className="py-2.5 pr-4 font-black">월</th>
                  <th className="py-2.5 pr-4 font-black">딜러</th>
                  <th className="py-2.5 pr-4 text-right font-black">주문</th>
                  <th className="py-2.5 pr-4 text-right font-black">수량</th>
                  <th className="py-2.5 pr-4 text-right font-black">판매금액</th>
                  <th className="py-2.5 font-black">품목별 데이터</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {dealerMonthStats.map((item) => {
                  const itemText =
                    item.itemList.length > 0
                      ? item.itemList.map((line) => `${line.name} x${line.qty} · ${money(line.amount)}`).join(" / ")
                      : "품목 없음";

                  return (
                    <tr key={`${item.month}-${item.dealer}`} className="align-top hover:bg-emerald-50/60">
                      <td className="whitespace-nowrap py-3 pr-4 font-extrabold text-slate-800">{item.month}</td>
                      <td className="whitespace-nowrap py-3 pr-4 font-extrabold text-slate-900">{item.dealer}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right font-black text-slate-700">
                        {item.count}건
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right font-black text-slate-700">
                        {item.qty}개
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right font-black text-emerald-700">
                        {money(item.amount)}
                      </td>
                      <td className="py-3 font-bold leading-relaxed text-slate-600">
                        <div className="max-w-[560px]" title={itemText}>
                          {itemText}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["ALL", "Y", "N"] as StatementFilter[]).map((filter) => (
              <button
                key={`quick-${filter}`}
                type="button"
                onClick={() => setStatementFilter(filter)}
                className={cls(
                  secondaryButton,
                  statementFilter === filter && "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {filter === "ALL" ? "전체 보기" : filter === "Y" ? "Y만 보기" : "N만 보기"}
              </button>
            ))}
            <button type="button" onClick={toggleAllStatements} className={secondaryButton}>
              {allStatementSelected ? "현재 Y 선택 해제" : "현재 Y 전체 선택"}
            </button>
            <button type="button" onClick={openAllVisibleStatements} className={secondaryButton}>
              현재 Y 전체 출력
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => openStatements(selectedStatementIds)} className={primaryButton}>
              선택 명세서 출력
            </button>
            <div className="text-sm font-extrabold text-emerald-800">
              선택 {selectedStatementIds.length}건 / Y {statementRows.length}건 / N {nonStatementRows.length}건
            </div>
          </div>
        </div>
      </section>

      <section className="lg:hidden">
        <div className="space-y-3">
          {visibleRows.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center text-sm font-extrabold text-slate-500">
              표시할 주문이 없습니다.
            </div>
          ) : (
            visibleRows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-500">{formatKst(row.createdAt)}</div>
                    <div className="mt-1 truncate text-lg font-black text-slate-950">{row.receiverName || "-"}</div>
                    <div className="mt-1 text-sm font-bold text-slate-600">{row.clientName || "-"}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                    {STATUS_LABEL[row.status] || row.status}
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-emerald-50 p-3">
                  <div className="mb-2 text-xs font-black text-emerald-800">포장 품목</div>
                  <div className="space-y-2">
                    {itemLines(row).map((item, index) => (
                      <div key={`${item.name}_${index}`} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 text-sm font-extrabold text-slate-900">{item.name}</div>
                        <div className="shrink-0 rounded-lg bg-white px-3 py-1 text-sm font-black text-emerald-700">
                          x{item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                  <div>
                    <span className="font-black text-slate-950">주소 </span>
                    {row.receiverAddr || "-"}
                  </div>
                  <div>
                    <span className="font-black text-slate-950">연락처 </span>
                    {[row.phone, row.mobile].filter(Boolean).join(" / ") || "-"}
                  </div>
                  <div>
                    <span className="font-black text-slate-950">딜러 </span>
                    {row.salesName || "-"} {row.salesPhone ? `(${row.salesPhone})` : ""}
                  </div>
                  <div>
                    <span className="font-black text-slate-950">비고 </span>
                    {row.note || "-"}
                  </div>
                  <div>
                    <span className="font-black text-slate-950">명세서 </span>
                    {statementDisplay(row)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {row.specYN === "Y" ? (
                    <>
                      <button className={secondaryButton} onClick={() => toggleStatementId(row.id)}>
                        {selectedStatementIds.includes(row.id) ? "명세서 선택됨" : "명세서 선택"}
                      </button>
                      <button className={primaryButton} onClick={() => openStatements([row.id])}>
                        명세서 출력
                      </button>
                    </>
                  ) : null}

                  {tab === "REQUESTED" ? (
                    <>
                      <button className={primaryButton} onClick={() => setStatus(row.id, "APPROVED")}>
                        승인
                      </button>
                      <button className={dangerButton} onClick={() => setStatus(row.id, "REJECTED")}>
                        거절
                      </button>
                    </>
                  ) : null}

                  {tab === "APPROVED" ? (
                    <>
                      <button className={secondaryButton} onClick={() => setStatus(row.id, "DONE")}>
                        출고완료
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm lg:block">
        <div className="overflow-auto">
          <table className="min-w-[1420px] w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-emerald-50 text-slate-800">
              <tr>
                {[
                  "등록일",
                  "품목",
                  "수량",
                  "명세서",
                  "영업사원",
                  "영업전화",
                  "수하인",
                  "주소",
                  "전화",
                  "핸드폰",
                  "거래처",
                  "요양기관번호",
                  "비고",
                  "작업",
                ].map((header) => (
                  <th key={header} className="border-b border-emerald-100 px-3 py-3 text-left font-black whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center font-extrabold text-slate-500">
                    표시할 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={row.id} className="border-b border-emerald-50 align-top hover:bg-emerald-50/50">
                    <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{formatKst(row.createdAt)}</td>
                    <td className="min-w-[240px] px-3 py-3 font-extrabold text-slate-950">
                      <div className="space-y-1">
                        {itemLines(row).map((item, index) => (
                          <div key={`${item.name}_${index}`}>{item.name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-black text-emerald-700 whitespace-nowrap">
                      <div className="space-y-1">
                        {itemLines(row).map((item, index) => (
                          <div key={`${item.name}_${index}`}>x{item.quantity}</div>
                        ))}
                      </div>
                    </td>
                    <td className="w-[170px] px-3 py-3 font-bold text-slate-700 whitespace-nowrap">
                      {statementBadge(row, selectedStatementIds.includes(row.id), () => toggleStatementId(row.id))}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{row.salesName || "-"}</td>
                    <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{row.salesPhone || "-"}</td>
                    <td className="px-3 py-3 font-black text-slate-950 whitespace-nowrap">{row.receiverName || "-"}</td>
                    <td className="min-w-[300px] px-3 py-3 font-bold text-slate-700">{row.receiverAddr || "-"}</td>
                    <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{row.phone || "-"}</td>
                    <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{row.mobile || "-"}</td>
                    <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{row.clientName || "-"}</td>
                    <td className="px-3 py-3 font-bold text-slate-700 whitespace-nowrap">{row.careInstitutionNo || "-"}</td>
                    <td className="min-w-[180px] px-3 py-3 font-bold text-slate-700">{row.note || "-"}</td>
                    <td className="min-w-[190px] px-3 py-3">
                      <div className="flex flex-nowrap items-start gap-2">
                        {row.specYN === "Y" ? (
                          <button className={primaryButton} onClick={() => openStatements([row.id])}>
                            명세서 출력
                          </button>
                        ) : null}

                        {tab === "REQUESTED" ? (
                          <>
                            <button className={primaryButton} onClick={() => setStatus(row.id, "APPROVED")}>
                              승인
                            </button>
                            <button className={dangerButton} onClick={() => setStatus(row.id, "REJECTED")}>
                              거절
                            </button>
                          </>
                        ) : null}

                        {tab === "APPROVED" ? (
                          <>
                            <button className={secondaryButton} onClick={() => setStatus(row.id, "DONE")}>
                              출고완료
                            </button>
                          </>
                        ) : (
                          tab !== "REQUESTED" && row.specYN !== "Y" ? (
                            <span className="font-black text-slate-400">-</span>
                          ) : null
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
