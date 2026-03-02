"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function AdminClient() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // ✅ 관리자 인증 확인만 먼저 (서버 렌더에서 터지지 않게, 클라에서 API로 확인)
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.user) {
        router.replace("/login");
        return;
      }
      const role = String(json.user.role || "").toUpperCase();
      if (role !== "ADMIN") {
        setErr("관리자 권한이 없습니다.");
      }
    })();
  }, [router]);

  return (
    <AppShell>
      {err ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-extrabold text-red-700">
          {err}
        </div>
      ) : null}

      <div className="text-2xl font-black tracking-tight">관리자 대시보드</div>
      <div className="mt-2 text-sm font-bold text-black/60">
        (여기서 주문/품목/거래처/사업자등록증/재고관리로 확장)
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-6">
        <div className="text-sm font-bold text-black/60">
          관리자 페이지 렌더 크래시 방지용 “안정화 버전” 적용 완료.
        </div>
      </div>
    </AppShell>
  );
}