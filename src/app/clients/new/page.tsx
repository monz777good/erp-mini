"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function ClientNewPage() {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const input =
    "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/20";

  async function submit() {
    setErr(null);
    setOk(null);

    if (!name.trim()) return setErr("거래처명을 입력해주세요.");
    setLoading(true);
    try {
      // ✅ 네 프로젝트에 이미 /api/sales/clients 가 있으니 거기로 POST 시도
      const res = await fetch("/api/sales/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          ownerName,
          bizNo,
          phone,
          address: addr,
        }),
      });

      if (res.status === 401) {
        setErr("로그인이 필요합니다. 다시 로그인 해주세요.");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || "저장 실패");
        return;
      }
      setOk("저장 완료!");
      setName("");
      setOwnerName("");
      setBizNo("");
      setPhone("");
      setAddr("");
    } catch {
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mt-2">
        {err ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-semibold">
            {err}
          </div>
        ) : null}
        {ok ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 font-semibold">
            {ok}
          </div>
        ) : null}

        <div className="text-2xl font-extrabold mb-1">거래처 등록</div>
        <div className="text-sm text-black/55 mb-6">
          거래처 정보를 입력하고 저장하세요.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-bold mb-2">거래처명</div>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동한의원" />
          </div>
          <div>
            <div className="text-sm font-bold mb-2">대표자명</div>
            <input className={input} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="예: 홍길동" />
          </div>
          <div>
            <div className="text-sm font-bold mb-2">사업자번호</div>
            <input className={input} value={bizNo} onChange={(e) => setBizNo(e.target.value)} placeholder="예: 123-45-67890" />
          </div>
          <div>
            <div className="text-sm font-bold mb-2">전화번호</div>
            <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="예: 01012345678" />
          </div>
          <div className="md:col-span-2">
            <div className="text-sm font-bold mb-2">주소</div>
            <input className={input} value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="예: 경기도 시흥시 ..." />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-black text-white font-extrabold shadow-md disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}