"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
  owner?: string | null;
  createdAt?: string;
};

export default function ClientsClient() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/sales/clients", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);

      // API가 {ok, clients} 형태든, 배열이든 둘 다 방어
      const list: Client[] = Array.isArray(data)
        ? data
        : (data?.clients ?? data?.items ?? []);

      setItems(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3">
        <div className="text-2xl font-black">거래처</div>
        <Link
          href="/clients/new"
          className="bg-black text-white px-4 py-2 rounded-2xl font-bold"
        >
          + 거래처 등록
        </Link>
      </div>

      <div className="mt-5 bg-white rounded-2xl border p-4">
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">등록된 거래처가 없습니다.</div>
        ) : (
          <div className="grid gap-2">
            {items.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold">{c.name}</div>
                  <div className="text-sm text-gray-600">
                    대표자: {c.owner || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}