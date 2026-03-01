"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"SALES" | "ADMIN">("SALES");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          phone,
          pin,
          role,
        }),
      });

      if (!res.ok) {
        alert("로그인 실패");
        return;
      }

      if (role === "ADMIN") router.push("/admin/dashboard");
      else router.push("/orders");
    } catch (err) {
      alert("로그인 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="erp-page-center erp-no-scroll">

      <form className="erp-login-card" onSubmit={handleLogin} autoComplete="off">

        <h1 className="erp-login-title">
          한의N원외탕전 ERP 로그인
        </h1>

        <p className="erp-login-sub">
          이름 / 전화번호 / PIN 입력 후 로그인
        </p>

        {/* 이름 */}
        <label className="erp-label">이름</label>
        <input
          className="erp-input"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />

        {/* 전화번호 */}
        <label className="erp-label">전화번호</label>
        <input
          className="erp-input"
          placeholder="01012341234"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          autoComplete="off"
        />

        {/* PIN */}
        <label className="erp-label">PIN</label>
        <input
          type="password"
          className="erp-input"
          placeholder="1111"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoComplete="new-password"
        />

        {/* 역할 */}
        <div className="erp-role-row">
          <label>
            <input
              type="radio"
              checked={role === "SALES"}
              onChange={() => setRole("SALES")}
            />
            영업사원
          </label>

          <label>
            <input
              type="radio"
              checked={role === "ADMIN"}
              onChange={() => setRole("ADMIN")}
            />
            관리자
          </label>
        </div>

        <button
          className="erp-login-btn"
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

      </form>
    </div>
  );
}