"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "SALES" | "ADMIN";

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();

  // ✅ 로그인 선택지(복구): 영업사원 / 관리자
  const [mode, setMode] = useState<Mode>("SALES");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => {
    return mode === "ADMIN" ? "관리자 로그인" : "영업사원 로그인";
  }, [mode]);

  async function onSubmit() {
    setErr(null);

    const p = onlyDigits(phone);
    if (!p) return setErr("전화번호를 입력해주세요.");
    if (!pin.trim()) return setErr("PIN을 입력해주세요.");

    setLoading(true);
    try {
      // ✅ 프로젝트에 이미 있는 라우트 기준:
      // - 영업사원: /api/auth/sales-login
      // - 관리자:   /api/auth/login
      const url = mode === "ADMIN" ? "/api/auth/login" : "/api/auth/sales-login";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim() || null,
          phone: p,
          pin: pin.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || json?.message || "로그인 실패");
        return;
      }

      // ✅ 로그인 성공 후 이동
      // 관리자도 영업사원 화면(/orders) 들어갈 수 있어야 한다고 했으니,
      // 기본은 mode에 맞춰 보내되, 나중에 주소로 직접 이동 가능하게 유지.
      if (mode === "ADMIN") router.replace("/admin");
      else router.replace("/orders");
    } catch {
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(99,102,241,0.35),transparent_40%),radial-gradient(1000px_circle_at_80%_20%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(900px_circle_at_50%_80%,rgba(236,72,153,0.20),transparent_50%),linear-gradient(to_bottom,#0b1020,#070a12)] px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur-xl">
          <div className="text-2xl font-black tracking-tight text-white">
            한의N원외탕전
          </div>
          <div className="mt-1 text-sm font-bold text-white/70">
            전화번호 + PIN 로그인 (처음 등록이면 이름도 입력)
          </div>

          {/* ✅ 로그인 모드 선택 (복구) */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("SALES")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                mode === "SALES"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              영업사원
            </button>
            <button
              type="button"
              onClick={() => setMode("ADMIN")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                mode === "ADMIN"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/80 hover:bg-white/15"
              }`}
            >
              관리자
            </button>
          </div>

          <div className="mt-3 text-sm font-extrabold text-white/80">
            {title}
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-200/40 bg-red-500/15 px-4 py-3 text-sm font-extrabold text-red-100">
              {err}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름(처음 등록시)"
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
              value={phone}
              onChange={(e) => setPhone(onlyDigits(e.target.value))}
              placeholder="전화번호(숫자만)"
              inputMode="numeric"
            />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
              value={pin}
              onChange={(e) => setPin(onlyDigits(e.target.value))}
              placeholder="PIN"
              inputMode="numeric"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-white px-5 py-3 font-black text-black shadow-lg disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="mt-4 text-xs font-bold text-white/55">
            ※ 관리자는 로그인 후 /admin 으로 이동합니다. (관리자도 /orders 접근 가능)
          </div>
        </div>
      </div>
    </div>
  );
}