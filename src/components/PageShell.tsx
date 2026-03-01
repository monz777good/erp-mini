"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Tab = { label: string; href: string };

export default function PageShell({
  title,
  tabs,
  children,
  showLogout = false,
  onLogout,
  errorText,
}: {
  title: string;
  tabs?: Tab[];
  children: React.ReactNode;
  showLogout?: boolean;
  onLogout?: () => void;
  errorText?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="erp-bg">
      <div className="erp-shell">
        <div className="erp-card">
          <div className="erp-card-header">
            <div className="erp-title">{title}</div>

            {tabs?.length ? (
              <div className="erp-tabs">
                {tabs.map((t) => {
                  const active =
                    pathname === t.href ||
                    (t.href !== "/" && pathname?.startsWith(t.href));
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      className={`erp-tab ${active ? "erp-tab-active" : ""}`}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1 }} />
            )}

            <div className="erp-actions">
              <button className="erp-btn" onClick={() => router.refresh()}>
                새로고침
              </button>
              {showLogout ? (
                <button
                  className="erp-btn"
                  onClick={() => (onLogout ? onLogout() : undefined)}
                >
                  로그아웃
                </button>
              ) : null}
            </div>
          </div>

          <div className="erp-card-body">
            {errorText ? <div className="erp-error">{errorText}</div> : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}