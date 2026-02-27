"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"SALES" | "ADMIN">("ADMIN");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = role === "ADMIN" ? "/api/auth/login" : "/api/auth/sales-login";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone, pin, autoLogin }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data?.error ?? "로그인 실패");
        return;
      }

      // 역할별 이동
      if (role === "ADMIN") router.push("/admin/dashboard");
      else router.push("/orders");
    } catch (err) {
      alert("로그인 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 배경 블러 오버레이 */}
      <div className="erp-bg-overlay" />

      {/* ✅ 스크롤 완전 제거 + 중앙 정렬 */}
      <div className="erp-page-center erp-no-scroll">
        <form onSubmit={onSubmit} className="erp-card">
          <h1 className="erp-title">ERP 로그인</h1>
          <p className="erp-subtitle">
            이름 / 전화번호 / PIN 입력 후 로그인
          </p>

          <div className="erp-form">
            {/* 이름 */}
            <div>
              <div className="erp-label">이름</div>
              <input
                className="erp-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>

            {/* 전화번호 */}
            <div>
              <div className="erp-label">전화번호</div>
              <input
                className="erp-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012341234"
                inputMode="tel"
                required
              />
            </div>

            {/* PIN */}
            <div>
              <div className="erp-label">PIN</div>
              <input
                className="erp-input"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1111"
                inputMode="numeric"
                required
              />
            </div>

            {/* 옵션 */}
            <div className="erp-options">
              <div className="erp-radio-group">
                <label>
                  <input
                    type="radio"
                    checked={role === "SALES"}
                    onChange={() => setRole("SALES")}
                  />{" "}
                  영업사원
                </label>

                <label>
                  <input
                    type="radio"
                    checked={role === "ADMIN"}
                    onChange={() => setRole("ADMIN")}
                  />{" "}
                  관리자
                </label>
              </div>

              <label className="erp-check">
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                />
                자동로그인
              </label>
            </div>

            <button className="erp-btn" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}