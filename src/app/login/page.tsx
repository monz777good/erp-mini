"use client";

import { useEffect, useState } from "react";

type Mode = "SALES" | "ADMIN";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<Mode>("SALES");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  // 입력/모드 바뀌면 경고문구 바로 지우기 (관리자 문구가 남아있는 문제 방지)
  useEffect(() => {
    if (msg) setMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, pin, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const payload = {
      name: name.trim(),
      phone: onlyDigits(phone),
      pin: onlyDigits(pin),

      // ✅ 서버가 뭘 보든 맞게 들어가도록 "중복"으로 넣음
      role: mode,                 // "SALES" | "ADMIN"
      mode: mode,                 // 혹시 mode 키를 쓰는 경우
      isAdmin: mode === "ADMIN",  // 혹시 boolean을 쓰는 경우
    };

    if (!payload.name) return setMsg("이름을 입력하세요.");
    if (!payload.phone) return setMsg("전화번호를 입력하세요.");
    if (payload.pin.length !== 6) return setMsg("PIN은 6자리 숫자입니다.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // JSON이면 메시지/리다이렉트까지 최대한 활용
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        setMsg(data?.message ?? "로그인 실패 (정보를 확인하세요).");
        return;
      }

      // ✅ 서버가 redirectUrl 내려주는 구조면 그걸 최우선
      const redirectUrl =
        data?.redirectUrl ||
        data?.redirect ||
        data?.url ||
        null;

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      // ✅ 아니면 모드로 기본 이동
      window.location.href = mode === "ADMIN" ? "/admin/dashboard" : "/orders";
    } catch {
      setMsg("네트워크 오류. 서버가 켜져있는지 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: 420,
          padding: 40,
          borderRadius: 18,
          background: "rgba(255,255,255,0.92)",
          border: "2px solid rgba(46,125,50,0.28)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 8, fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>
          ERP 로그인
        </h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          style={{ padding: 12, borderRadius: 10, border: "2px solid rgba(46,125,50,0.25)" }}
        />

        <input
          value={phone}
          onChange={(e) => setPhone(onlyDigits(e.target.value))}
          placeholder="전화번호"
          inputMode="numeric"
          style={{ padding: 12, borderRadius: 10, border: "2px solid rgba(46,125,50,0.25)" }}
        />

        <input
          value={pin}
          onChange={(e) => setPin(onlyDigits(e.target.value))}
          placeholder="개인 PIN (6자리)"
          inputMode="numeric"
          style={{ padding: 12, borderRadius: 10, border: "2px solid rgba(46,125,50,0.25)" }}
        />

        <div style={{ display: "flex", gap: 18, justifyContent: "center", fontWeight: 800 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="radio"
              checked={mode === "SALES"}
              onChange={() => setMode("SALES")}
            />
            영업사원
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="radio"
              checked={mode === "ADMIN"}
              onChange={() => setMode("ADMIN")}
            />
            관리자
          </label>
        </div>

        {msg ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(244,67,54,0.08)",
              border: "1px solid rgba(244,67,54,0.25)",
              color: "#b71c1c",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {msg}
          </div>
        ) : null}

        {/* ✅ 로그인 버튼: 녹색 고정 */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 6,
            padding: 14,
            borderRadius: 12,
            border: "2px solid #2E7D32",
            background: loading ? "#5a8f5d" : "#2E7D32",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}