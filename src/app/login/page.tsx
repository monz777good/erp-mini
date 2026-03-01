"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<"SALES" | "ADMIN">("SALES");
  const [autoLogin, setAutoLogin] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_login_saved");
      if (!saved) return;
      const obj = JSON.parse(saved);
      if (obj?.name) setName(obj.name);
      if (obj?.phone) setPhone(obj.phone);
      if (obj?.pin) setPin(obj.pin);
      if (obj?.role === "ADMIN" || obj?.role === "SALES") setRole(obj.role);
      if (typeof obj?.autoLogin === "boolean") setAutoLogin(obj.autoLogin);
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const endpoint = role === "ADMIN" ? "/api/login" : "/api/sales-login";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, phone, pin }),
    });

    if (!res.ok) {
      alert("로그인 실패");
      return;
    }

    if (autoLogin) {
      localStorage.setItem(
        "erp_login_saved",
        JSON.stringify({ name, phone, pin, role, autoLogin })
      );
    } else {
      localStorage.removeItem("erp_login_saved");
    }

    router.replace(role === "ADMIN" ? "/admin/dashboard" : "/orders");
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/bg.jpg')",
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl bg-white/85 backdrop-blur-md shadow-2xl border border-white/40 overflow-hidden">
          <div className="px-6 py-7 md:px-10 md:py-10">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
              한의N원외탕전 ERP 로그인
            </h1>
            <p className="mt-2 text-sm md:text-base text-neutral-600">
              이름 / 전화번호 / PIN 입력 후 로그인
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-5">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">
                  이름
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-neutral-900/20"
                  placeholder="예: 홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">
                  전화번호
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-neutral-900/20"
                  placeholder="숫자만 입력"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-800">
                  PIN
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-neutral-900/20"
                  placeholder="예: 1111"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                    <input
                      type="radio"
                      name="role"
                      checked={role === "SALES"}
                      onChange={() => setRole("SALES")}
                    />
                    영업사원
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                    <input
                      type="radio"
                      name="role"
                      checked={role === "ADMIN"}
                      onChange={() => setRole("ADMIN")}
                    />
                    관리자
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={autoLogin}
                    onChange={(e) => setAutoLogin(e.target.checked)}
                  />
                  자동로그인
                </label>
              </div>

              <button
                type="submit"
                className="mt-2 h-12 w-full rounded-2xl bg-neutral-900 text-white font-extrabold tracking-wide shadow-lg hover:bg-neutral-800 active:scale-[0.99]"
              >
                로그인
              </button>

              <div className="pt-3 text-center text-sm text-neutral-600 font-semibold">
                © 한의N원외탕전
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}