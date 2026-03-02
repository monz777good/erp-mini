"use client";

import AdminTopNav from "@/components/AdminTopNav";
import { useEffect, useMemo, useState } from "react";

type Item = { id: string; name: string; createdAt?: string };

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function load() {
    setMsg("");
    const res = await fetch("/api/admin/items", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      setMsg(`불러오기 실패 (${res.status})`);
      setItems([]);
      return;
    }

    const data = await res.json().catch(() => []);
    setItems(Array.isArray(data) ? data : []);
  }

  async function add() {
    setMsg("");
    const n = name.trim();
    if (!n) {
      setMsg("품목명을 입력해주세요.");
      return;
    }

    const res = await fetch("/api/admin/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n }),
    });

    if (!res.ok) {
      const t = await res.json().catch(() => null);
      setMsg(t?.message || `추가 실패 (${res.status})`);
      return;
    }
    setName("");
    await load();
  }

  async function del(id: string) {
    if (!confirm("삭제할까요?")) return;
    setMsg("");
    const res = await fetch(`/api/admin/items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setMsg(`삭제 실패 (${res.status})`);
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return items;
    return items.filter((x) => x.name?.includes(s));
  }, [items, q]);

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <AdminTopNav />

      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="m-0 text-xl sm:text-2xl font-black text-black">품목 등록 (관리자)</h1>
              <div className="mt-2 text-sm font-bold text-gray-700">
                품목 추가/삭제는 관리자만 가능합니다.
              </div>
            </div>

            <button
              onClick={load}
              className="h-10 rounded-xl border border-gray-300 bg-white px-4 text-sm font-black text-black"
            >
              새로고침
            </button>
          </div>

          {msg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
              {msg}
            </div>
          ) : null}

          {/* 입력/검색 */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-black text-black mb-2">품목 추가</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="품목명 (예: 죽염 1.8 2mL)"
                className={inputCls}
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                <button onClick={add} className="h-10 rounded-xl bg-black px-4 text-sm font-black text-white">
                  추가
                </button>
                <button
                  onClick={() => {
                    setName("");
                    setMsg("");
                  }}
                  className="h-10 rounded-xl border border-gray-300 bg-white px-4 text-sm font-black text-black"
                >
                  입력 초기화
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-black text-black mb-2">검색</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="품목 검색 (예: 죽염, 자하거, PDRN...)"
                className={inputCls}
              />
              <div className="mt-3 text-sm font-bold text-gray-700">
                {filtered.length}개 표시 / 전체 {items.length}개
              </div>
            </div>
          </div>

          {/* 목록 */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-[#f3f4f6] border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-black text-black">목록</div>
              <div className="text-xs font-bold text-gray-700">{filtered.length}개</div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-5 text-center text-sm font-black text-gray-700">목록이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filtered.map((it) => (
                  <div key={it.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="text-sm sm:text-base font-black text-black break-words">{it.name}</div>
                    <button
                      onClick={() => del(it.id)}
                      className="h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-black text-red-700 whitespace-nowrap"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs font-bold text-gray-700">
            * 품목명은 중복될 수 없습니다. (중복이면 추가 실패 메시지가 뜹니다)
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10";