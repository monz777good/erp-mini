"use client";

import { useMemo, useState } from "react";

type Role = "SALES" | "ADMIN";

function cls(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function LoginPage() {
  const [role, setRole] = useState<Role>("SALES");

  // ✅ 영업사원만 사용
  const [name, setName] = useState("");

  const [phone, setPhone] = useState("01012341234");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!phone.trim() || !pin.trim()) return false;
    if (role === "SALES" && !name.trim()) return false;
    return true;
  }, [role, name, phone, pin]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const url = role === "ADMIN" ? "/api/admin-login" : "/api/sales-login";

      const payload =
        role === "ADMIN"
          ? { phone: phone.trim(), pin: pin.trim() }
          : { name: name.trim(), phone: phone.trim(), pin: pin.trim() };

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setErr(data?.error || `HTTP_${res.status}`);
        return;
      }

      // ✅ 성공 이동
      if (role === "ADMIN") window.location.href = "/admin";
      else window.location.href = "/orders";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-[100svh] w-full px-4 py-10"
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 20%, rgba(120,105,255,0.22), transparent 55%), radial-gradient(900px 600px at 80% 30%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(900px 700px at 50% 90%, rgba(255,255,255,0.08), transparent 55%), linear-gradient(180deg, rgb(8,10,18), rgb(12,14,24))",
      }}
    >
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] p-6 md:p-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white/70">ERP MINI</div>
            <div className="mt-1 text-2xl font-extrabold">한의N원외탕전</div>
            <div className="mt-2 text-white/60 text-sm">
              {role === "SALES"
                ? "이름 + 전화번호 + PIN 로그인 (영업사원: 최초 로그인 시 등록)"
                : "전화번호 + PIN 로그인 (관리자)"}
            </div>
          </div>
        </div>

        {/* 역할 토글 */}
        <div className="mt-6 flex rounded-2xl border border-white/15 bg-white/10 p-1">
          <button
            className={cls(
              "flex-1 rounded-xl py-3 font-extrabold transition",
              role === "SALES" ? "bg-white text-black" : "text-white/80 hover:bg-white/10"
            )}
            type="button"
            onClick={() => setRole("SALES")}
          >
            영업사원
          </button>
          <button
            className={cls(
              "flex-1 rounded-xl py-3 font-extrabold transition",
              role === "ADMIN" ? "bg-white text-black" : "text-white/80 hover:bg-white/10"
            )}
            type="button"
            onClick={() => setRole("ADMIN")}
          >
            관리자
          </button>
        </div>

        {/* 입력 */}
        <div className="mt-6 space-y-4">
          {/* ✅ 영업사원만 이름 */}
          {role === "SALES" ? (
            <div>
              <div className="text-sm text-white/70">이름 (필수)</div>
              <input
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/30"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
              />
            </div>
          ) : null}

          <div>
            <div className="text-sm text-white/70">전화번호</div>
            <input
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/30"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012341234"
              inputMode="numeric"
            />
          </div>

          <div>
            <div className="text-sm text-white/70">PIN</div>
            <input
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/30"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              type="password"
              inputMode="numeric"
            />
          </div>

          {err ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
              {err}
            </div>
          ) : null}

          <button
            className="mt-2 w-full rounded-xl bg-white py-4 font-extrabold text-black disabled:opacity-60"
            disabled={!canSubmit || loading}
            onClick={submit}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="text-center text-white/55 text-sm mt-2">
            {role === "ADMIN"
              ? "관리자는 로그인 후 /admin 으로 이동합니다. (관리자도 /orders 접근 가능)"
              : "영업사원은 로그인 후 /orders 로 이동합니다."}
          </div>
        </div>
      </div>
    </div>
  );
}