"use client";

import { useState } from "react";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const [role, setRole] = useState<"SALES" | "ADMIN">("SALES");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [auto, setAuto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          phone: digitsOnly(phone),
          pin: String(pin ?? "").trim(),
          role,
          autoLogin: auto,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "LOGIN_FAILED");

      window.location.href = role === "ADMIN" ? "/admin/orders" : "/orders";
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-bg">
      <div className="app-inner">
        <div className="center-wrap">
          <div className="login-card">
            <div className="login-title">한의N원외탕전 ERP 로그인</div>
            <div className="login-sub">이름 / 전화번호 / PIN 입력 후 로그인</div>

            <form onSubmit={onSubmit}>
              <div className="form-grid">
                <div className="label">이름</div>
                <input className="input" placeholder="예: 홍길동" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="form-grid">
                <div className="label">전화번호</div>
                <input className="input" placeholder="숫자만 입력" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="form-grid">
                <div className="label">PIN</div>
                <input className="input" placeholder="예: 1111" value={pin} onChange={(e) => setPin(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginTop: 10, fontWeight: 900 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="radio" checked={role === "SALES"} onChange={() => setRole("SALES")} />
                  영업사원
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="radio" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} />
                  관리자
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
                  자동로그인
                </label>
              </div>

              {err ? <div className="msg err" style={{ marginTop: 14 }}>{err}</div> : null}

              <button className="btn btn-primary" style={{ width: "100%", marginTop: 14, padding: "14px 16px", borderRadius: 16 }} disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div style={{ marginTop: 14, textAlign: "center", color: "rgba(0,0,0,.55)", fontWeight: 800 }}>
              © 한의N원외탕전
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}