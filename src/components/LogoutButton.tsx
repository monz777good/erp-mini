"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    window.location.href = "/login";
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-60"
    >
      {loading ? "로그아웃..." : "로그아웃"}
    </button>
  );
}