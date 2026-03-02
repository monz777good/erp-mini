"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState(""); // ✅ 처음 등록용
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/sales-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: String(name || ""),
          phone: digitsOnly(phone),
          pin: String(pin || ""),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMsg(data?.message || "로그인 실패");
        return;
      }

      router.replace("/orders");
    } catch {
      setMsg("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100svh] flex items-center justify-center px-4">
      <div className="glass w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <div className="text-2xl font-extrabold tracking-tight">
            한의N원외탕전
          </div>
          <div className="text-sm" style={{ color: "rgba(200,208,230,.72)" }}>
            전화번호 + PIN 로그인 (처음 등록이면 이름도 입력)
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="input"
            placeholder="이름 (처음 등록일 때만)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />

          <input
            className="input"
            placeholder="전화번호 숫자만 (예: 01012341234)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
          />

          <input
            className="input"
            placeholder="PIN 입력"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
          />

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          {msg ? (
            <div className="glass-soft px-4 py-3 text-sm" style={{ color: "rgba(255,200,200,.95)" }}>
              {msg}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}