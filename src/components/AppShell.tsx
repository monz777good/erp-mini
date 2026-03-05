"use client";

import { ReactNode, useState } from "react";

export default function AppShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // 네트워크 에러여도 일단 로그인으로 보냄(세션은 서버에서 지워지는게 베스트지만 UX는 이게 안전)
    } finally {
      // ✅ 절대 localhost 하드코딩 금지, 상대경로로 이동
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-[100svh] w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            {title ? <h1 className="text-3xl font-extrabold text-white">{title}</h1> : null}
            {subtitle ? <p className="mt-1 text-sm text-white/65">{subtitle}</p> : null}
          </div>

          <button
            onClick={onLogout}
            disabled={loading}
            className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-extrabold text-white hover:bg-white/15 disabled:opacity-60"
          >
            {loading ? "로그아웃..." : "로그아웃"}
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}