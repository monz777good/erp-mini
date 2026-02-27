// ✅ 경로: src/app/login/page.tsx
"use client";

import { useMemo, useState } from "react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"SALES" | "ADMIN">("SALES");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

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
      // ✅ 절대 풀 URL 쓰지 말고 상대경로로!
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ 쿠키 저장 핵심
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          pin: pin.trim(),
          role,
          remember,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setMsg(data?.message || "로그인 실패");
        return;
      }

      // ✅ role에 따라 이동
      const r = String(data?.user?.role || role).toUpperCase();
      if (r === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/orders";
      }
    } catch (e: any) {
      setMsg("네트워크 오류");
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
        padding: 24,
        backgroundImage:
          "linear-gradient(rgba(10,15,25,.35), rgba(10,15,25,.35)), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          width: "min(520px, 92vw)",
          background: "rgba(255,255,255,.92)",
          borderRadius: 18,
          padding: 26,
          boxShadow: "0 18px 60px rgba(0,0,0,.25)",
          border: "1px solid rgba(0,0,0,.08)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 900 }}>ERP 로그인</div>
          <div style={{ color: "#666", marginTop: 6 }}>
            이름 / 전화번호 / PIN 입력 후 로그인
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 이현택"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>전화번호</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예) 01023833691"
              inputMode="tel"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700 }}>PIN</span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN 4자리 이상"
              inputMode="numeric"
              style={inputStyle}
            />
          </label>

          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                checked={role === "SALES"}
                onChange={() => setRole("SALES")}
              />
              <span style={{ fontWeight: 800 }}>영업사원</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                checked={role === "ADMIN"}
                onChange={() => setRole("ADMIN")}
              />
              <span style={{ fontWeight: 800 }}>관리자</span>
            </label>

            <span style={{ flex: 1 }} />

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span style={{ fontWeight: 800 }}>자동로그인</span>
            </label>
          </div>

          {msg ? (
            <div style={{ color: "#d11", fontWeight: 800 }}>{msg}</div>
          ) : (
            <div style={{ height: 20 }} />
          )}

          <button
            onClick={onLogin}
            disabled={!canSubmit || loading}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 12,
              border: "none",
              cursor: !canSubmit || loading ? "not-allowed" : "pointer",
              background: !canSubmit || loading ? "#9bb79a" : "#1f7a3a",
              color: "white",
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          {/* ✅ 확인 문구는 이제 필요없으면 지워도 됨 */}
          {/* <div style={{ marginTop: 8, fontWeight: 900 }}>AUTOLOGIN_BUILD_OK</div> */}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 46,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,.18)",
  padding: "0 14px",
  outline: "none",
  fontSize: 16,
  background: "white",
};