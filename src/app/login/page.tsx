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

  const title = useMemo(() => (mode === "SALES" ? "영업사원 로그인" : "관리자 로그인"), [mode]);

  async function submit() {
    setErr(null);

    const p = onlyDigits(phone);
    if (!p) return setErr("전화번호를 입력해주세요.");
    if (!pin) return setErr("PIN을 입력해주세요.");

    // 영업사원은 최초 등록 시 이름 필요 (서버에서 요구할 수도 있으니 조건 완화)
    if (mode === "SALES" && name.trim().length === 0) {
      // 이름이 DB에 이미 있으면 없어도 되게 만들고 싶지만,
      // 지금은 서버가 요구할 수도 있으니 입력 유도만 해둠.
      // return setErr("영업사원은 이름을 입력해주세요.");
    }

    setLoading(true);
    try {
      // ✅ 여기 중요: “로그인 API 경로 혼선”을 끊기 위해 경로를 하나로 고정
      // 네 라우트 목록에 /api/auth/login, /api/auth/sales-login 이 있으니 그걸 사용
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
      router.replace(mode === "ADMIN" ? "/admin" : "/orders");
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