"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      // ✅ 너 프로젝트 기본: /api/auth/logout (POST)
      // 만약 너 프로젝트가 /api/logout 이면 아래 줄만 바꿔.
      const res = await fetch("/api/auth/logout", { method: "POST" });

      // 실패해도 로그인으로 보내서 세션 꼬임 방지
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={logout} disabled={loading} style={btn}>
      {loading ? "로그아웃..." : "로그아웃"}
    </button>
  );
}

const btn: React.CSSProperties = {
  height: 34,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontWeight: 900,
  background: "white",
  cursor: "pointer",
};
