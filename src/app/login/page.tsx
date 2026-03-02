"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"SALES" | "ADMIN">("SALES");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: tab,     // ⭐ 탭 그대로 서버로
          name,
          phone,
          pin,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.message || "로그인 실패");

      router.replace(String(data.redirect || (tab === "ADMIN" ? "/admin/orders" : "/orders")));
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "로그인 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560, borderRadius: 18, padding: 24, border: "1px solid #ddd" }}>
        <div style={{ fontSize: 28, fontWeight: 900 }}>한의N원외탕전</div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setTab("SALES")}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              fontWeight: 900,
              border: "1px solid #ddd",
              background: tab === "SALES" ? "#111" : "#fff",
              color: tab === "SALES" ? "#fff" : "#111",
            }}
          >
            영업사원
          </button>
          <button
            onClick={() => setTab("ADMIN")}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              fontWeight: 900,
              border: "1px solid #ddd",
              background: tab === "ADMIN" ? "#111" : "#fff",
              color: tab === "ADMIN" ? "#fff" : "#111",
            }}
          >
            관리자
          </button>
        </div>

        {/* ✅ 이름은 항상 보이게 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>이름</div>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inp} placeholder="이름(신규 영업 등록시 필요)" />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>전화번호</div>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inp} placeholder="숫자만" />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>PIN</div>
          <input value={pin} onChange={(e) => setPin(e.target.value)} style={inp} placeholder="PIN" />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 18,
            width: "100%",
            padding: 14,
            borderRadius: 14,
            fontWeight: 900,
            border: "none",
            background: "#111",
            color: "#fff",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "로그인중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontWeight: 800,
};