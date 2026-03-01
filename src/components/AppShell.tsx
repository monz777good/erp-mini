"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = sp.get("tab") || "order";

  const [checking, setChecking] = useState(true);

  // ✅ 로그인 세션 체크 (깨졌으면 /login으로)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
      } catch {
        router.replace("/login");
        return;
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const tabs = useMemo(
    () => [
      { label: "주문", href: "/orders?tab=order", active: pathname === "/orders" && tab === "order" },
      { label: "조회", href: "/orders?tab=history", active: pathname === "/orders" && tab === "history" },
      { label: "거래처 등록", href: "/clients/new", active: pathname?.startsWith("/clients") },
    ],
    [pathname, tab]
  );

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      router.replace("/login");
    }
  }

  if (checking) {
    return (
      <div className="erp-bg">
        <div className="erp-shell">
          <div className="erp-card">
            <div className="erp-body" style={{ fontWeight: 900 }}>
              로딩 중...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-bg">
      <div className="erp-shell">
        <div className="erp-card">
          <div className="erp-header">
            <div className="erp-brand">한의N원외탕전 ERP</div>

            <div className="erp-tabs">
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`erp-tab ${t.active ? "erp-tab-active" : ""}`}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            <div className="erp-actions">
              <button className="erp-btn" onClick={() => router.refresh()}>
                새로고침
              </button>
              <button className="erp-btn" onClick={logout}>
                로그아웃
              </button>
            </div>
          </div>

          <div className="erp-body">{children}</div>
        </div>
      </div>
    </div>
  );
}