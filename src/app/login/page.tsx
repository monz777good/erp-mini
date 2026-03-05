"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "SALES" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("SALES");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => "한의N원외탕전", []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: name.trim(),
          phone: phone.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setErr(data?.error || "로그인 실패");
        setLoading(false);
        return;
      }

      // ✅ 관리자면 /admin, 영업이면 /orders
      router.replace(role === "ADMIN" ? "/admin" : "/orders");
    } catch (e: any) {
      setErr(e?.message || "네트워크 오류");
      setLoading(false);
    }
  }

  const card =
    "w-[min(560px,92vw)] max-w-[560px] rounded-2xl border border-white/25 " +
    "bg-white/8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] " +
    "p-6 md:p-7";

  // ✅ 여기 input 스타일이 핵심: 글씨(검정) + caret + min-w-0 + w-full
  const input =
    "w-full min-w-0 rounded-xl border border-white/25 bg-white/92 " +
    "px-4 py-3 text-[15px] font-medium text-[#111] placeholder:text-gray-500 " +
    "caret-[#111] outline-none " +
    "focus:border-white/40 focus:ring-2 focus:ring-white/15";

  const label = "text-[13px] font-semibold text-white/90 drop-shadow";
  const tabBtnBase =
    "flex-1 rounded-xl py-2.5 text-sm font-semibold transition " +
    "border border-white/25";

  return (
    <div className="min-h-screen w-full grid place-items-center px-4">
      <div className={card}>
        <div className="text-xl font-extrabold tracking-tight text-white drop-shadow">
          {title}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setRole("SALES")}
            className={
              tabBtnBase +
              " " +
              (role === "SALES"
                ? "bg-black/70 text-white"
                : "bg-white/90 text-[#111]")
            }
          >
            영업사원
          </button>

          <button
            type="button"
            onClick={() => setRole("ADMIN")}
            className={
              tabBtnBase +
              " " +
              (role === "ADMIN"
                ? "bg-black/70 text-white"
                : "bg-white/90 text-[#111]")
            }
          >
            관리자
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className={label}>이름</div>
            <input
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <div className={label}>전화번호</div>
            <input
              className={input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="숫자만"
              inputMode="numeric"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <div className={label}>PIN</div>
            <input
              className={input}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm text-white">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={
              "mt-2 w-full rounded-xl py-3 font-extrabold " +
              "bg-black/75 text-white border border-white/15 " +
              "hover:bg-black/85 transition " +
              (loading ? "opacity-60 cursor-not-allowed" : "")
            }
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}