"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // ✅ hydration 전 화면 숨김 (깜빡임 제거 핵심)
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"SALES" | "ADMIN">("SALES");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // 🔥 이 줄이 깜빡임 제거

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          phone,
          pin,
          role,
          autoLogin,
        }),
      });

      if (!res.ok) {
        alert("로그인 실패");
        setLoading(false);
        return;
      }

      // ✅ 관리자면 관리자 페이지로
      if (role === "ADMIN") {
        router.push("/admin/orders");
      } else {
        router.push("/orders");
      }

      router.refresh();
    } catch (err) {
      alert("서버 오류");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 15% 15%, rgba(30,58,138,.35), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(2,132,199,.25), transparent 55%), linear-gradient(180deg, #06121a 0%, #071b25 35%, #07111a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: 420,
          background: "white",
          borderRadius: 24,
          padding: 30,
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
          한의N원외탕전 ERP 로그인
        </h1>

        <div style={{ fontWeight: 600, opacity: 0.7, marginBottom: 20 }}>
          이름 / 전화번호 / PIN 입력 후 로그인
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>이름</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>전화번호</div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012341234"
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>PIN</div>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="예: 1111"
            required
            style={{ width: "100%" }}
          />
        </div>

        <div
          style={{
            background: "#f4f4f4",
            padding: 14,
            borderRadius: 16,
            marginBottom: 20,
          }}
        >
          <label style={{ marginRight: 16 }}>
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

          <div style={{ marginTop: 10 }}>
            <label>
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />{" "}
              자동로그인
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 18,
            background: loading ? "#999" : "#222",
            color: "white",
            fontWeight: 900,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontWeight: 700,
            opacity: 0.5,
            fontSize: 13,
          }}
        >
          © 한의N원외탕전
        </div>
      </form>
    </div>
  );
}