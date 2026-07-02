"use client";

import { useMemo, useState } from "react";

type Role = "SALES" | "ADMIN";

function cls(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

export default function LoginPage() {
  const [role, setRole] = useState<Role>("SALES");
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
        setErr(data?.error || data?.message || `HTTP_${res.status}`);
        return;
      }

      window.location.href = role === "ADMIN" ? "/admin/orders" : "/orders";
    } catch {
      setErr("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 h-14 w-full rounded-xl border border-emerald-100 bg-white px-4 text-base font-extrabold text-slate-950 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <main
      className="flex min-h-[100svh] w-full items-center justify-center px-4 py-8"
      style={{
        background: "linear-gradient(180deg, #f7fbf7 0%, #edf7ef 48%, #f9fffb 100%)",
      }}
    >
      <section className="w-full max-w-[560px] rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_20px_70px_rgba(22,101,52,0.12)] sm:p-8">
        <div className="text-sm font-black text-emerald-700">ERP MINI</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">한의N원외탕전</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          {role === "SALES"
            ? "영업사원은 이름, 전화번호, PIN으로 로그인합니다."
            : "관리자는 전화번호와 PIN으로 로그인합니다."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-1">
          <button
            className={cls(
              "h-12 rounded-xl text-base font-black transition",
              role === "SALES"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-emerald-100"
            )}
            type="button"
            onClick={() => setRole("SALES")}
          >
            영업사원
          </button>
          <button
            className={cls(
              "h-12 rounded-xl text-base font-black transition",
              role === "ADMIN"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-emerald-100"
            )}
            type="button"
            onClick={() => setRole("ADMIN")}
          >
            관리자
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {role === "SALES" ? (
            <label className="block">
              <span className="text-sm font-extrabold text-slate-700">이름</span>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                autoComplete="off"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-extrabold text-slate-700">전화번호</span>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012341234"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="text-sm font-extrabold text-slate-700">PIN</span>
            <input
              className={inputClass}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              type="password"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>

          {err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700">
              {err}
            </div>
          ) : null}

          <button
            className="h-14 w-full rounded-xl border border-emerald-600 bg-emerald-600 text-base font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={!canSubmit || loading}
            onClick={submit}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="text-center text-sm font-bold text-slate-500">
            관리자는 로그인 후 주문관리 화면으로 이동합니다.
          </div>
        </div>
      </section>
    </main>
  );
}
