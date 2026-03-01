"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "SALES" | "ADMIN";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<Mode>("ADMIN");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ 자동로그인: 저장된 값 채우기
  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_autologin_v1");
      if (!saved) return;
      const d = JSON.parse(saved);
      setName(d?.name ?? "");
      setPhone(d?.phone ?? "");
      setPin(d?.pin ?? "");
      setMode(d?.mode ?? "ADMIN");
      setAutoLogin(Boolean(d?.autoLogin ?? true));
    } catch {}
  }, []);

  // ✅ 화면 스크롤/삐져나옴 완전 방지
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 1 && digitsOnly(phone).length >= 9 && pin.trim().length >= 4;
  }, [name, phone, pin]);

  async function onSubmit() {
    setMsg(null);
    if (!canSubmit) {
      setMsg("이름/전화번호/PIN을 확인해주세요.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: digitsOnly(phone),
        pin: pin.trim(),
        mode,
        autoLogin,
      };

      // ✅ 네 프로젝트에 /api/login, /api/auth/login 등 여러 개 있었으니
      // 지금은 가장 흔한 /api/login으로 먼저 시도
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "로그인 실패");
      }

      if (autoLogin) {
        localStorage.setItem("erp_autologin_v1", JSON.stringify(payload));
      } else {
        localStorage.removeItem("erp_autologin_v1");
      }

      // ✅ 로그인 후 이동
      router.replace(mode === "ADMIN" ? "/admin/dashboard" : "/orders");
    } catch (e: any) {
      setMsg(e?.message ? String(e.message).slice(0, 200) : "로그인 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="erp-page erp-center">
      <div className="erp-container">
        <div className="erp-card">
          <div className="erp-card-pad">
            <h1 className="erp-title">ERP 로그인</h1>
            <p className="erp-subtitle">이름 / 전화번호 / PIN 입력 후 로그인</p>

            <label className="erp-label">이름</label>
            <input
              className="erp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
            />

            <label className="erp-label">전화번호</label>
            <input
              className="erp-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012341234"
              inputMode="tel"
              autoComplete="tel"
            />

            <label className="erp-label">PIN</label>
            <input
              className="erp-input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="1111"
              inputMode="numeric"
              autoComplete="one-time-code"
              type="password"
            />

            <div className="erp-row" style={{ marginTop: 14, justifyContent: "space-between" }}>
              <div className="erp-row" style={{ gap: 14 }}>
                <label className="erp-row" style={{ gap: 6 }}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "SALES"}
                    onChange={() => setMode("SALES")}
                  />
                  <span style={{ fontWeight: 900 }}>영업사원</span>
                </label>

                <label className="erp-row" style={{ gap: 6 }}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "ADMIN"}
                    onChange={() => setMode("ADMIN")}
                  />
                  <span style={{ fontWeight: 900 }}>관리자</span>
                </label>
              </div>

              <label className="erp-row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                />
                <span style={{ fontWeight: 900 }}>자동로그인</span>
              </label>
            </div>

            {msg ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.06)",
                  fontWeight: 800,
                }}
              >
                {msg}
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <button className="erp-btn" onClick={onSubmit} disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </div>
          </div>
        </div>

        {/* ✅ 바깥 영역에서 배경 위 텍스트 필요하면 여기서 사용 */}
        {/* <div className="erp-outline-white" style={{ marginTop: 14, fontWeight: 900 }}>
          관리자 대시보드, 품목 등록(관리자), 거래처/사업자등록증...
        </div> */}
      </div>
    </div>
  );
}