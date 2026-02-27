"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"SALES" | "ADMIN">("ADMIN");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // ✅ 자동로그인 값 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("AUTO_LOGIN_INFO");
    if (saved) {
      const v = JSON.parse(saved);
      setName(v.name ?? "");
      setPhone(v.phone ?? "");
      setPin(v.pin ?? "");
      setRole(v.role ?? "ADMIN");
      setAutoLogin(true);
    }
  }, []);

  async function handleLogin() {
    if (!name || !phone || !pin) {
      alert("정보를 입력하세요");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, phone, pin, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.message || "로그인 실패");
      return;
    }

    // ✅ 자동로그인 저장
    if (autoLogin) {
      localStorage.setItem(
        "AUTO_LOGIN_INFO",
        JSON.stringify({ name, phone, pin, role })
      );
    } else {
      localStorage.removeItem("AUTO_LOGIN_INFO");
    }

    // 이동
    if (role === "ADMIN") location.href = "/admin/dashboard";
    else location.href = "/orders";
  }

  return (
    <div style={bg}>
      <div style={card}>
        <h2 style={{ marginBottom: 8 }}>ERP 로그인</h2>
        <div style={{ marginBottom: 20, color: "#666" }}>
          이름 / 전화번호 / PIN 입력 후 로그인
        </div>

        <label style={label}>이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          style={input}
        />

        <label style={label}>전화번호</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01012341234"
          style={input}
        />

        <label style={label}>PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="1111"
          style={input}
        />

        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <label>
            <input
              type="radio"
              checked={role === "SALES"}
              onChange={() => setRole("SALES")}
            />{" "}
            영업사원
          </label>

          <label>
            <input
              type="radio"
              checked={role === "ADMIN"}
              onChange={() => setRole("ADMIN")}
            />{" "}
            관리자
          </label>

          <label style={{ marginLeft: "auto" }}>
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
            />{" "}
            자동로그인
          </label>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={btn}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}

/* ================= 스타일 ================= */

const bg: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundImage:
    "url(https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070)",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const card: React.CSSProperties = {
  width: 420,
  padding: 32,
  borderRadius: 16,
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const label: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginTop: 12,
  display: "block",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  marginTop: 6,
  fontSize: 14,
};

const btn: React.CSSProperties = {
  width: "100%",
  marginTop: 20,
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "#2e7d32",
  color: "white",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};