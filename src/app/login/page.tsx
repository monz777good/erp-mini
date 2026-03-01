"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RoleChoice = "SALES" | "ADMIN";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<RoleChoice>("SALES");
  const [autoLogin, setAutoLogin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 1 &&
      digitsOnly(phone).length >= 8 &&
      pin.trim().length >= 4
    );
  }, [name, phone, pin]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          phone: digitsOnly(phone),
          pin: pin.trim(),
          role,
          autoLogin,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMsg(data?.message || "로그인 실패");
        setLoading(false);
        return;
      }

      // ✅ 로그인 성공 후 이동
      router.push(role === "ADMIN" ? "/admin" : "/orders");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[560px] bg-white/95 rounded-3xl shadow-xl px-6 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          한의N원외탕전 ERP 로그인
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          이름 / 전화번호 / PIN 입력 후 로그인
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-lg font-extrabold mb-2">이름</label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-lg font-extrabold mb-2">
              전화번호
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="01012341234"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block text-lg font-extrabold mb-2">PIN</label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="예: 1111"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="one-time-code"
            />
          </div>

          {/* ✅ 모바일에서 깨지던 부분: 라디오/텍스트/체크박스 정렬 고정 */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="role"
                checked={role === "SALES"}
                onChange={() => setRole("SALES")}
                className="h-5 w-5"
              />
              <span className="text-xl font-extrabold whitespace-nowrap">
                영업사원
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="role"
                checked={role === "ADMIN"}
                onChange={() => setRole("ADMIN")}
                className="h-5 w-5"
              />
              <span className="text-xl font-extrabold whitespace-nowrap">
                관리자
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className="h-5 w-5"
              />
              <span className="text-xl font-extrabold whitespace-nowrap">
                자동로그인
              </span>
            </div>
          </div>

          {msg ? (
            <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {msg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={[
              "w-full rounded-2xl py-5 text-xl font-extrabold",
              "bg-slate-900 text-white shadow-lg",
              "disabled:bg-slate-300 disabled:shadow-none",
            ].join(" ")}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}