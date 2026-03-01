"use client";

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"SALES" | "ADMIN">("SALES");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setLoading(true);
    setMsg("");

    try {
      const endpoint = mode === "ADMIN" ? "/api/admin-login" : "/api/sales-login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, pin }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(data?.message ?? "로그인 실패");
        setLoading(false);
        return;
      }

      // ✅ 로그인 성공 후 내 role 확인
      const meRes = await fetch("/api/me", { credentials: "include" });
      const me = await meRes.json().catch(() => null);

      if (me?.user?.role === "ADMIN") {
        // ADMIN은 /admin 우선 (원하면 /orders로 바로 보내도 됨)
        window.location.href = "/admin/orders";
      } else {
        window.location.href = "/orders";
      }
    } catch (e: any) {
      setMsg(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-white">한의N원외탕전 로그인</h1>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm ${
                mode === "SALES" ? "bg-white/15 text-white" : "bg-white/5 text-white/70"
              }`}
              onClick={() => setMode("SALES")}
              disabled={loading}
            >
              영업사원
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm ${
                mode === "ADMIN" ? "bg-white/15 text-white" : "bg-white/5 text-white/70"
              }`}
              onClick={() => setMode("ADMIN")}
              disabled={loading}
            >
              관리자
            </button>
          </div>
        </div>

        <label className="block text-sm text-white/80 mb-1">전화번호</label>
        <input
          className="w-full mb-3 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
          placeholder="숫자만 (예: 01023833691)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />

        <label className="block text-sm text-white/80 mb-1">PIN</label>
        <input
          className="w-full mb-4 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
          placeholder="PIN 입력"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={loading}
          type="password"
        />

        {msg ? (
          <div className="mb-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {msg}
          </div>
        ) : null}

        <button
          className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div className="mt-4 text-xs text-white/50">
          * ADMIN은 영업 화면(/orders, /clients)도 접속 가능 / SALES는 영업 화면만 가능
        </div>
      </div>
    </div>
  );
}