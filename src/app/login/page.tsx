"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "SALES" | "ADMIN";

const LS_KEY = "erp_autologin_v1";

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // ✅ 저장된 자동로그인 값 불러오기
  useEffect(() => {
    const saved = safeJsonParse<{
      name: string;
      phone: string;
      pin: string;
      role: Role;
      autoLogin: boolean;
    }>(localStorage.getItem(LS_KEY));

    if (saved?.autoLogin) {
      setName(saved.name ?? "");
      setPhone(saved.phone ?? "");
      setPin(saved.pin ?? "");
      setRole(saved.role ?? "ADMIN");
      setAutoLogin(true);
    }
  }, []);

  // ✅ 자동로그인 ON 상태면 입력값 바뀔 때마다 저장(편의)
  useEffect(() => {
    if (!autoLogin) return;
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ name, phone, pin, role, autoLogin: true })
    );
  }, [name, phone, pin, role, autoLogin]);

  // ✅ 자동로그인 OFF면 저장값 삭제
  useEffect(() => {
    if (autoLogin) return;
    localStorage.removeItem(LS_KEY);
  }, [autoLogin]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && phone.trim().length >= 8 && pin.trim().length >= 4;
  }, [name, phone, pin]);

  async function onLogin() {
    setMsg("");
    if (!canSubmit) {
      setMsg("이름/전화번호/PIN을 확인해주세요.");
      return;
    }

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
          role, // 서버에서 role 검증/설정하도록
          autoLogin,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.message ?? "로그인 실패");
        return;
      }

      // ✅ 자동로그인 저장(최종 확정)
      if (autoLogin) {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({ name, phone, pin, role, autoLogin: true })
        );
      } else {
        localStorage.removeItem(LS_KEY);
      }

      // ✅ 역할에 따라 이동
      if (String(role).toUpperCase() === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/orders";
      }
    } catch (e: any) {
      setMsg(e?.message ?? "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px 14px",
      }}
    >
      <div className="erp-card" style={{ width: "100%", maxWidth: 520, padding: 22 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>ERP 로그인</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.55)", fontWeight: 700 }}>
            이름 / 전화번호 / PIN 입력 후 로그인
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>이름</div>
            <input
              className="erp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
            />
          </div>

          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>전화번호</div>
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
            <div style={{ fontWeight: 900, marginBottom: 6 }}>PIN</div>
            <input
              className="erp-input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="1111"
              inputMode="numeric"
              autoComplete="one-time-code"
              type="password"
            />
          </div>

          {/* 라디오 + 자동로그인 (모바일에서도 줄바꿈 깨지지 않게) */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              marginTop: 4,
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 900 }}>
                <input
                  type="radio"
                  name="role"
                  checked={role === "SALES"}
                  onChange={() => setRole("SALES")}
                />
                영업사원
              </label>

              <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 900 }}>
                <input
                  type="radio"
                  name="role"
                  checked={role === "ADMIN"}
                  onChange={() => setRole("ADMIN")}
                />
                관리자
              </label>
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 900 }}>
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              자동로그인
            </label>
          </div>

          <button className="erp-btn" onClick={onLogin} disabled={!canSubmit || loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          {msg ? (
            <div
              style={{
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,0,0,0.08)",
                color: "rgba(140,0,0,0.95)",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {msg}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}