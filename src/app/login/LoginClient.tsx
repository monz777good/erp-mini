"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

type Mode = "SALES" | "ADMIN";

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("SALES");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => "한의N원외탕전", []);

  async function onSubmit() {
    setErr(null);

    const cleanPhone = onlyDigits(phone);
    const cleanPin = onlyDigits(pin);

    if (mode === "SALES" && !name.trim()) {
      return setErr("이름을 입력해주세요.");
    }
    if (!cleanPhone) return setErr("전화번호를 입력해주세요.");
    if (!cleanPin) return setErr("PIN을 입력해주세요.");

    setLoading(true);
    try {
      const url = mode === "ADMIN" ? "/api/auth/login" : "/api/auth/sales-login";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: mode === "SALES" ? name.trim() : undefined,
          phone: cleanPhone,
          pin: cleanPin,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || json?.message || "로그인 실패");
        return;
      }

      // ✅ 로그인 성공 → 역할에 맞게 이동
      if (mode === "ADMIN") router.replace("/admin");
      else router.replace("/orders");
    } catch {
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 flex items-center justify-center px-4">
      <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-3xl font-black tracking-tight text-white">{title}</div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-black/20 p-1">
          <button
            className={`rounded-2xl py-3 font-black ${
              mode === "SALES" ? "bg-white text-black" : "text-white/80 hover:text-white"
            }`}
            onClick={() => setMode("SALES")}
            type="button"
          >
            영업사원
          </button>
          <button
            className={`rounded-2xl py-3 font-black ${
              mode === "ADMIN" ? "bg-white text-black" : "text-white/80 hover:text-white"
            }`}
            onClick={() => setMode("ADMIN")}
            type="button"
          >
            관리자
          </button>
        </div>

        <div className="mt-5 text-sm font-extrabold text-white/85">
          {mode === "ADMIN" ? "관리자 로그인" : "영업사원 로그인"}
        </div>

        {mode === "SALES" ? (
          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            autoComplete="off"
          />
        ) : null}

        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/20"
          value={phone}
          onChange={(e) => setPhone(onlyDigits(e.target.value))}
          placeholder="전화번호(숫자만)"
          inputMode="numeric"
          autoComplete="off"
        />

        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/20"
          value={pin}
          onChange={(e) => setPin(onlyDigits(e.target.value))}
          placeholder="PIN"
          inputMode="numeric"
          autoComplete="off"
        />

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-200/30 bg-red-500/15 px-4 py-3 font-extrabold text-red-200">
            {err}
          </div>
        ) : null}

        <button
          onClick={onSubmit}
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-white py-4 font-black text-black shadow-lg disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}