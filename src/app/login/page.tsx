"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "SALES" | "ADMIN";

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("SALES");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "SALES" ? "영업사원 로그인" : "관리자 로그인"),
    [mode]
  );

  async function submit() {
    setErr(null);

    const p = onlyDigits(phone);
    if (!p) return setErr("전화번호를 입력해주세요.");
    if (!pin) return setErr("PIN을 입력해주세요.");

    setLoading(true);
    try {
      // ✅ 경로는 auth로 고정(우리가 proxy로 /api/*에 연결해둠)
      const url = mode === "ADMIN" ? "/api/auth/login" : "/api/auth/sales-login";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim() || null,
          phone: p,
          pin: String(pin),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || json?.message || "로그인 실패");
        return;
      }

      // ✅ 쿠키 반영 + 서버 라우트 재평가
      router.refresh();

      // ✅ 여기 핵심: role은 /api/me로 확인해서 확정 이동 (튕김 방지)
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const me = await meRes.json().catch(() => null);

      const role = String(me?.role ?? "").toUpperCase();
      if (role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/orders");
      }
    } catch {
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-emerald-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
        <div className="px-10 pt-10 pb-8">
          <div className="text-4xl font-black tracking-tight text-white">한의N원외탕전</div>

          <div className="mt-6 flex rounded-2xl bg-black/20 p-1">
            <button
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black ${
                mode === "SALES" ? "bg-white text-black" : "text-white/80"
              }`}
              onClick={() => setMode("SALES")}
              type="button"
            >
              영업사원
            </button>
            <button
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black ${
                mode === "ADMIN" ? "bg-white text-black" : "text-white/80"
              }`}
              onClick={() => setMode("ADMIN")}
              type="button"
            >
              관리자
            </button>
          </div>

          <div className="mt-5 text-sm font-black text-white/80">{title}</div>

          {mode === "SALES" ? (
            <input
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름(처음 등록시)"
            />
          ) : null}

          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/20"
            value={phone}
            onChange={(e) => setPhone(onlyDigits(e.target.value))}
            placeholder="전화번호(숫자만)"
            inputMode="numeric"
          />

          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 font-bold text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/20"
            value={pin}
            onChange={(e) => setPin(onlyDigits(e.target.value))}
            placeholder="PIN"
            inputMode="numeric"
          />

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">
              {err}
            </div>
          ) : null}

          <button
            disabled={loading}
            onClick={submit}
            className="mt-6 w-full rounded-2xl bg-white py-4 font-black text-black shadow-lg disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}