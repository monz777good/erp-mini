"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginRole = "SALES" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<LoginRole>("ADMIN");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 자동로그인 값이 있으면 채워주기(있으면 편함)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("erp_autologin");
      if (!raw) return;
      const v = JSON.parse(raw);
      if (v?.name) setName(String(v.name));
      if (v?.phone) setPhone(String(v.phone));
      if (v?.pin) setPin(String(v.pin));
      if (v?.role) setRole(String(v.role).toUpperCase() === "SALES" ? "SALES" : "ADMIN");
      if (typeof v?.autoLogin === "boolean") setAutoLogin(v.autoLogin);
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const payload = {
      name: String(name || "").trim(),
      phone: String(phone || "").trim(),
      pin: String(pin || "").trim(),
      role,
      autoLogin,
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error || "로그인 실패");
        return;
      }

      // autoLogin이면 로컬에 저장
      if (autoLogin) {
        localStorage.setItem(
          "erp_autologin",
          JSON.stringify({ name: payload.name, phone: payload.phone, pin: payload.pin, role: payload.role, autoLogin })
        );
      } else {
        localStorage.removeItem("erp_autologin");
      }

      // 역할별 이동
      if (String(role).toUpperCase() === "ADMIN") router.push("/admin/dashboard");
      else router.push("/orders");
    } catch (e: any) {
      setErr(e?.message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="erp-center erp-no-scroll">
      <div className="erp-card">
        <div style={{ marginBottom: 10 }}>
          <div className="erp-title-outline" style={{ fontSize: 40 }}>
            ERP 로그인
          </div>
          <div className="erp-subtle2" style={{ marginTop: 6, fontWeight: 800 }}>
            이름 / 전화번호 / PIN 입력 후 로그인
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="erp-label">이름</div>
          <input
            className="erp-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
          />

          <div className="erp-label">전화번호</div>
          <input
            className="erp-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012341234"
            inputMode="tel"
            autoComplete="tel"
          />

          <div className="erp-label">PIN</div>
          <input
            className="erp-input"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="1111"
            inputMode="numeric"
            autoComplete="one-time-code"
          />

          <div className="erp-row">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
              <input type="radio" checked={role === "SALES"} onChange={() => setRole("SALES")} />
              영업사원
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
              <input type="radio" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} />
              관리자
            </label>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900, marginLeft: "auto" }}>
              <input type="checkbox" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />
              자동로그인
            </label>
          </div>

          {err ? (
            <div style={{ marginTop: 10, fontWeight: 900, color: "#b91c1c" }}>
              {err}
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <button className="erp-btn" type="submit" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}