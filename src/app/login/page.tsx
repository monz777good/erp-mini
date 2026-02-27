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
  const [msg, setMsg] = useState<string>("");

  // 자동로그인 체크 시: 로컬에 저장된 입력값이 있으면 채움(선택)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_login_form");
      if (!saved) return;
      const v = JSON.parse(saved);
      setName(v?.name ?? "");
      setPhone(v?.phone ?? "");
      setPin(v?.pin ?? "");
      setRole((v?.role ?? "ADMIN") as Role);
      setAutoLogin(Boolean(v?.autoLogin ?? true));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "erp_login_form",
        JSON.stringify({ name, phone, pin, role, autoLogin })
      );
    } catch {}
  }, [name, phone, pin, role, autoLogin]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      // ✅ 너 프로젝트에 /api/auth/login 이 있는 상태라 그걸로 보냄
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          phone,
          pin,
          role, // 서버가 role 무시해도 괜찮고, 쓰면 더 좋고
          autoLogin,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.message || "로그인 실패");
        setLoading(false);
        return;
      }

      // ✅ 성공 시 역할별 이동
      if (String(data?.user?.role ?? role).toUpperCase() === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/orders";
      }
    } catch {
      setMsg("로그인 요청 실패(네트워크)");
      setLoading(false);
    }
  }

  return (
    <div className="erp-page-center">
      <div className="erp-card">
        <h1 className="erp-title">ERP 로그인</h1>
        <p className="erp-subtitle">이름 / 전화번호 / PIN 입력 후 로그인</p>

        <form className="erp-form" onSubmit={onSubmit}>
          <div>
            <div className="erp-label">이름</div>
            <input
              className="erp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
            />
          </div>

          <div>
            <div className="erp-label">전화번호</div>
            <input
              className="erp-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012341234"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <div className="erp-label">PIN</div>
            <input
              className="erp-input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="1111"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          <div className="erp-options">
            <div className="erp-radio-group">
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="radio"
                  name="role"
                  checked={role === "SALES"}
                  onChange={() => setRole("SALES")}
                />
                영업사원
              </label>

              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="radio"
                  name="role"
                  checked={role === "ADMIN"}
                  onChange={() => setRole("ADMIN")}
                />
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

          {msg ? (
            <div style={{ fontWeight: 900, color: "#b00020", marginTop: 4 }}>{msg}</div>
          ) : null}

          <button className="erp-btn" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}