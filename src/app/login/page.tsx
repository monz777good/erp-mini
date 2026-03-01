// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "SALES" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("홍길동");
  const [phone, setPhone] = useState("01012341234");
  const [pin, setPin] = useState("1111");
  const [role, setRole] = useState<Role>("SALES");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // (옵션) 자동로그인 체크면 저장값 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem("erp_login_pref");
      if (!raw) return;
      const v = JSON.parse(raw);
      if (typeof v?.name === "string") setName(v.name);
      if (typeof v?.phone === "string") setPhone(v.phone);
      if (typeof v?.role === "string") setRole(v.role === "ADMIN" ? "ADMIN" : "SALES");
      if (typeof v?.autoLogin === "boolean") setAutoLogin(v.autoLogin);
    } catch {}
  }, []);

  // 자동로그인 켜져있으면 입력값 저장
  useEffect(() => {
    try {
      if (!autoLogin) return;
      localStorage.setItem(
        "erp_login_pref",
        JSON.stringify({ name, phone, role, autoLogin })
      );
    } catch {}
  }, [name, phone, role, autoLogin]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: String(name ?? "").trim(),
          phone: String(phone ?? "").replace(/\D/g, ""),
          pin: String(pin ?? "").trim(),
          role,
          autoLogin,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `로그인 실패 (${res.status})`);
      }

      // role별 이동
      router.replace(role === "ADMIN" ? "/admin/dashboard" : "/orders");
    } catch (e: any) {
      setErr(e?.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="erp-page">
      {/* ✅ 로그인은 “큰 겉 카드(전체 카드)” 없이 중앙 카드 1개만 */}
      <div className="erp-center" style={{ padding: "24px 12px" }}>
        <div className="erp-card" style={{ maxWidth: 760 }}>
          <h1 className="erp-title">한의N원외탕전 ERP 로그인</h1>
          <p className="erp-subtitle">이름 / 전화번호 / PIN 입력 후 로그인</p>

          <form onSubmit={onSubmit}>
            <div className="erp-field">
              <label className="erp-label" htmlFor="name">이름</label>
              <input
                id="name"
                className="erp-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
            </div>

            <div className="erp-field">
              <label className="erp-label" htmlFor="phone">전화번호</label>
              <input
                id="phone"
                className="erp-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012341234"
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>

            <div className="erp-field">
              <label className="erp-label" htmlFor="pin">PIN</label>
              <input
                id="pin"
                className="erp-input"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="예: 1111"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            {/* ✅ 라디오/체크박스: 모바일에서 안 깨지는 “정석 flex + label 전체 클릭” */}
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "SALES"}
                    onChange={() => setRole("SALES")}
                  />
                  영업사원
                </label>

                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "ADMIN"}
                    onChange={() => setRole("ADMIN")}
                  />
                  관리자
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 950 }}>
                  <input
                    type="checkbox"
                    checked={autoLogin}
                    onChange={(e) => setAutoLogin(e.target.checked)}
                  />
                  자동로그인
                </label>
              </div>
            </div>

            {err ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(239,68,68,.10)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#991b1b",
                  fontWeight: 900,
                }}
              >
                {err}
              </div>
            ) : null}

            <button
              className="erp-btn"
              style={{ marginTop: 16 }}
              disabled={loading}
              type="submit"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* ✅ 모바일에서 2컬럼 깨질 때 대비: 아래 미디어 쿼리 영향 안 받도록 */}
          <style jsx>{`
            @media (max-width: 600px) {
              form > div[style*="grid-template-columns: 1fr 1fr"] {
                grid-template-columns: 1fr !important;
              }
              form > div[style*="grid-template-columns: 1fr 1fr"] > div:last-child {
                justify-content: flex-start !important;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}