"use client";

import { useEffect, useState } from "react";

type Role = "SALES" | "ADMIN";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // ✅ 자동로그인: 로컬 저장값 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem("AUTO_LOGIN_INFO");
      if (saved) {
        const v = JSON.parse(saved);
        setName(v?.name ?? "");
        setPhone(v?.phone ?? "");
        setPin(v?.pin ?? "");
        setRole((v?.role as Role) ?? "ADMIN");
        setAutoLogin(true);
      }
    } catch {}
  }, []);

  async function handleLogin() {
    if (!name.trim() || !phone.trim() || !pin.trim()) {
      alert("이름/전화번호/PIN을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ 쿠키 붙이기 핵심
        body: JSON.stringify({ name, phone, pin, role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.message || "로그인 실패");
        return;
      }

      // ✅ 자동로그인 저장/삭제
      if (autoLogin) {
        localStorage.setItem(
          "AUTO_LOGIN_INFO",
          JSON.stringify({ name, phone, pin, role })
        );
      } else {
        localStorage.removeItem("AUTO_LOGIN_INFO");
      }

      // 이동
      location.href = role === "ADMIN" ? "/admin/dashboard" : "/orders";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center">
      <div className="card">
        <h1 className="h-title">ERP 로그인</h1>
        <p className="h-sub">이름 / 전화번호 / PIN 입력 후 로그인</p>

        <div className="form">
          <div>
            <div className="label">이름</div>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
            />
          </div>

          <div>
            <div className="label">전화번호</div>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012341234"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <div className="label">PIN</div>
            <input
              className="input"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="1111"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          <div className="row">
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

            <span className="spacer" />

            <label>
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              자동로그인
            </label>
          </div>

          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}