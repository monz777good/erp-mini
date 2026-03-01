"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export default function AppShell({
  title = "한의N원외탕전 ERP",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = sp.get("tab") || "order";

  const router = useRouter();
  const [me, setMe] = useState<any>(null);

  // ✅ 로그인 상태 확인 (401이면 로그인으로)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        setMe(json);
      } catch {}
    })();
  }, [router]);

  const isOrders = pathname?.startsWith("/orders");
  const isClients = pathname?.startsWith("/clients");

  const pillBase =
    "px-4 py-2 rounded-full text-sm font-semibold transition border";
  const pillOn =
    "bg-black text-white border-black shadow-sm";
  const pillOff =
    "bg-white/70 text-black border-white/40 hover:bg-white/85";

  return (
    <div className="w-full max-w-5xl">
      <div className="rounded-[28px] bg-white/85 border border-white/50 shadow-xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-white/60 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="text-lg font-extrabold tracking-tight">
              {title}
            </div>
            {me?.name ? (
              <div className="text-sm text-black/50">
                {me.name} · {String(me.role || "").toLowerCase()}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-full bg-white/70 hover:bg-white border border-white/40 text-sm font-semibold"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
            <Link
              href="/logout"
              className="px-4 py-2 rounded-full bg-white/70 hover:bg-white border border-white/40 text-sm font-semibold"
            >
              로그아웃
            </Link>
          </div>
        </div>

        {/* Nav pills */}
        <div className="flex items-center justify-center gap-2 px-6 py-4">
          <Link
            href="/orders?tab=order"
            className={cx(
              pillBase,
              isOrders && tab === "order" ? pillOn : pillOff
            )}
          >
            주문
          </Link>
          <Link
            href="/orders?tab=history"
            className={cx(
              pillBase,
              isOrders && tab === "history" ? pillOn : pillOff
            )}
          >
            조회
          </Link>
          <Link
            href="/clients/new"
            className={cx(pillBase, isClients ? pillOn : pillOff)}
          >
            거래처 등록
          </Link>
        </div>

        {/* Body */}
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
}