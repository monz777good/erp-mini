"use client";

import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"SALES" | "ADMIN">("SALES");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function onlyDigits(v: string) {
    return v.replace(/\D/g, "");
  }

  async function login() {
    setError("");

    const url =
      mode === "ADMIN" ? "/api/auth/login" : "/api/auth/sales-login";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        phone: onlyDigits(phone),
        pin,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json?.error || "로그인 실패");
      return;
    }

    // 로그인 성공 → 역할별 이동
    if (mode === "ADMIN") location.href = "/admin";
    else location.href = "/orders";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-cyan-900">

      <div className="w-[380px] rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl border border-white/20">

        <div className="text-2xl font-black text-white mb-6 text-center">
          한의N원외탕전
        </div>

        {/* 역할 선택 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("SALES")}
            className={`flex-1 py-2 rounded-xl font-bold ${
              mode === "SALES"
                ? "bg-white text-black"
                : "bg-white/20 text-white"
            }`}
          >
            영업사원 로그인
          </button>

          <button
            onClick={() => setMode("ADMIN")}
            className={`flex-1 py-2 rounded-xl font-bold ${
              mode === "ADMIN"
                ? "bg-white text-black"
                : "bg-white/20 text-white"
            }`}
          >
            관리자 로그인
          </button>
        </div>

        {/* 입력 */}
        <input
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-white/20 text-white outline-none"
        />

        <input
          placeholder="전화번호"
          value={phone}
          onChange={(e) => setPhone(onlyDigits(e.target.value))}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-white/20 text-white outline-none"
        />

        <input
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/20 text-white outline-none"
        />

        <button
          onClick={login}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-black"
        >
          로그인
        </button>

        {error && (
          <div className="mt-4 text-red-300 font-bold text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}