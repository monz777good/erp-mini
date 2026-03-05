"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function NewClientPage() {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");

  return (
    <AppShell>
      <div className="text-2xl font-black tracking-tight">거래처 등록</div>
      <div className="mt-2 text-sm font-bold text-black/55">
        (우선 UI/라우팅 안정화) 등록 API 연결은 다음 단계에서 붙이면 됨
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-black">거래처명</div>
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: OO한의원"
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-black">대표자명</div>
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-black/20"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="예: 홍길동"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="rounded-2xl bg-black px-6 py-3 font-black text-white shadow-md"
          onClick={() => alert("다음 단계에서 저장 API 붙이면 됨")}
        >
          등록
        </button>
      </div>
    </AppShell>
  );
}