"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  name: string;
  owner?: string | null;
  createdAt?: string;
};

export default function ClientsClient() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
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

      // API가 {ok, clients} 이든 배열이든 다 방어
      const list: Client[] =
        Array.isArray(data) ? data : Array.isArray(data?.clients) ? data.clients : [];

      setClients(list);
    } catch {
      setClients([]);
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
        <button
          className="bg-black text-white px-5 py-2 rounded-2xl font-bold"
          onClick={() => router.push("/clients/new")}
        >
          거래처 등록
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-sm opacity-70">불러오는 중...</div>
        ) : clients.length === 0 ? (
          <div className="text-sm opacity-70">등록된 거래처가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-black/5">
                <tr className="text-left">
                  <th className="p-3 font-extrabold">거래처명</th>
                  <th className="p-3 font-extrabold">대표자</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-black/10">
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3">{c.owner ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}