"use client";

import { useMemo, useState } from "react";
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
    return name.trim().length >= 2 && digitsOnly(phone).length >= 8 && pin.trim().length >= 4;
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error || "로그인 실패 (정보를 확인해주세요)");
        return;
      }

      if (String(role).toUpperCase() === "ADMIN") router.push("/admin/dashboard");
      else router.push("/orders");
    } catch {
      setMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="erp-shell">
      <div className="erp-center">
        <div className="erp-card" style={{ width: "min(720px, 100%)" }}>
          <h1 className="erp-title">한의N원외탕전 ERP 로그인</h1>
          <p className="erp-subtitle">이름 / 전화번호 / PIN 입력 후 로그인</p>

          <form onSubmit={onSubmit}>
            <div className="erp-field">
              <label className="erp-label">이름</label>
              <input
                className="erp-input"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="erp-field">
              <label className="erp-label">전화번호</label>
              <input
                className="erp-input"
                placeholder="01012341234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>

            <div className="erp-field">
              <label className="erp-label">PIN</label>
              <input
                className="erp-input"
                placeholder="예: 1111"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                inputMode="numeric"
              />
            </div>

            <div className="erp-row" style={{ justifyContent: "space-between", marginTop: 6, marginBottom: 16 }}>
              <div className="erp-row" style={{ gap: 16 }}>
                <label className="erp-row" style={{ gap: 8, fontWeight: 900 }}>
                  <input type="radio" checked={role === "SALES"} onChange={() => setRole("SALES")} />
                  영업사원
                </label>
                <label className="erp-row" style={{ gap: 8, fontWeight: 900 }}>
                  <input type="radio" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} />
                  관리자
                </label>
              </div>

              <label className="erp-row" style={{ gap: 8, fontWeight: 900 }}>
                <input type="checkbox" checked={autoLogin} onChange={() => setAutoLogin((v) => !v)} />
                자동로그인
              </label>
            </div>

            {msg ? (
              <div
                style={{
                  marginBottom: 12,
                  fontWeight: 900,
                  color: "#b91c1c",
                  background: "rgba(185,28,28,0.08)",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              >
                {msg}
              </div>
            ) : null}

            <button className="erp-btn" type="submit" disabled={!canSubmit || loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}