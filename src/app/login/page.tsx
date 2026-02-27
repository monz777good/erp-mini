"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, phone, remember }),
    });

    const data = await res.json();

    if (data?.user?.role === "ADMIN") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/orders");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="bg-white p-8 rounded-xl shadow w-96 space-y-3"
      >
        <div className="text-xl font-bold">ERP 로그인</div>

        <input
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <input
          placeholder="전화번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 w-full rounded"
        />

        {/* ✅ 자동로그인 */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          자동로그인
        </label>

        <button
          className="bg-green-700 text-white w-full py-2 rounded"
          disabled={loading}
        >
          로그인
        </button>

        {/* 🔥 이거 보이면 코드 적용 성공 */}
        <div className="text-xs text-red-500">AUTOLOGIN_BUILD_OK</div>
      </form>
    </div>
  );
}