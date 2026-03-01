"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"SALES" | "ADMIN">("SALES");
  const [auto, setAuto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 자동로그인(선택)
  useEffect(() => {
    if (!auto) return;
    // 이미 로그인돼 있으면 서버가 알아서 리다이렉트 하게 (기존 로직 유지용)
    // /api/me 같은 게 있으면 여기서 체크해도 되는데,
    // 지금은 UI 정리 목적이라 비워둠.
  }, [auto]);

  function digitsOnly(v: string) {
    return v.replace(/\D/g, "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        phone: digitsOnly(phone),
        pin: String(pin ?? "").trim(),
        role,
        autoLogin: auto,
      };

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "LOGIN_FAILED");

      // 보통 서버에서 role에 따라 redirect를 주거나,
      // 프론트에서 이동시키는 구조일 수 있어서 둘 다 안전 처리
      if (role === "ADMIN") window.location.href = "/admin/orders";
      else window.location.href = "/orders";
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
            <div style={{ fontSize: 34, fontWeight: 950, marginBottom: 6 }}>
              한의N원외탕전 ERP 로그인
            </div>
            <div style={{ color: "rgba(0,0,0,.65)", fontWeight: 800 }}>
              이름 / 전화번호 / PIN 입력 후 로그인
            </div>

            <form onSubmit={onSubmit}>
              <div className="field">
                <div className="label">이름</div>
                <input
                  className="input"
                  placeholder="예: 홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="label">전화번호</div>
                <input
                  className="input"
                  placeholder="숫자만 입력"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="label">PIN</div>
                <input
                  className="input"
                  placeholder="예: 1111"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>

              <div className="field" style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                  <input
                    type="radio"
                    checked={role === "SALES"}
                    onChange={() => setRole("SALES")}
                  />
                  영업사원
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                  <input
                    type="radio"
                    checked={role === "ADMIN"}
                    onChange={() => setRole("ADMIN")}
                  />
                  관리자
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
                  <input
                    type="checkbox"
                    checked={auto}
                    onChange={(e) => setAuto(e.target.checked)}
                  />
                  자동로그인
                </label>
              </div>

              {err ? (
                <div style={{ marginTop: 14, color: "crimson", fontWeight: 900 }}>
                  {err}
                </div>
              ) : null}

              <button
                className="btn"
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: 18,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "rgba(0,0,0,.85)",
                  color: "white",
                  border: "none",
                  fontWeight: 950,
                }}
              >
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