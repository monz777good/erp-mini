"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

type Client = {
  id: string;
  name: string;
  bizRegNo?: string | null;
  receiverName?: string | null;
  receiverAddr?: string | null;
  receiverTel?: string | null;
  receiverMob?: string | null;
  memo?: string | null;
  createdAt?: string;
};

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/sales/clients", {
        method: "GET",
        credentials: "include", // ✅ 필수
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const m = data?.message ?? `HTTP ${res.status}`;
        throw new Error(m);
      }

      setClients(Array.isArray(data?.clients) ? data.clients : []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return clients;
    return clients.filter((c) => {
      return (
        String(c.name ?? "").toLowerCase().includes(keyword) ||
        String(c.bizRegNo ?? "").toLowerCase().includes(keyword) ||
        String(c.receiverName ?? "").toLowerCase().includes(keyword) ||
        String(c.receiverTel ?? "").toLowerCase().includes(keyword) ||
        String(c.receiverMob ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [clients, q]);

  return (
    <AppShell>
      <div className="space-y-4">
        {/* ✅ 타이틀은 AppShell prop이 아니라 페이지 내부에서 렌더링 */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight text-white">거래처 조회</div>
            <div className="mt-1 text-sm text-white/60">
              SALES는 내 거래처만, ADMIN은 전체 조회
            </div>
          </div>

          <button
            onClick={load}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white hover:bg-white/15"
          >
            새로고침
          </button>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="거래처명 / 사업자번호 / 대표자 / 전화 검색"
          className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none backdrop-blur"
        />

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            불러오는 중...
          </div>
        )}

        {!loading && err && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            <div className="font-bold">거래처 불러오기 실패</div>
            <div className="mt-2 text-sm opacity-90">{err}</div>
          </div>
        )}

        {!loading && !err && filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            거래처가 없습니다. (먼저 거래처 등록을 해봐)
          </div>
        )}

        {!loading && !err && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-12 gap-2 border-b border-white/10 px-4 py-3 text-xs text-white/60">
              <div className="col-span-4">거래처명</div>
              <div className="col-span-3">사업자번호</div>
              <div className="col-span-3">전화</div>
              <div className="col-span-2 text-right">메모</div>
            </div>

            {filtered.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-2 px-4 py-4 text-sm text-white/90 hover:bg-white/5"
              >
                <div className="col-span-4 font-semibold">{c.name}</div>
                <div className="col-span-3">{c.bizRegNo ?? "-"}</div>
                <div className="col-span-3">
                  {c.receiverMob ?? c.receiverTel ?? "-"}
                </div>
                <div className="col-span-2 text-right text-white/60 line-clamp-1">
                  {c.memo ?? "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}