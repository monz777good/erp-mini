import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

async function currentPath() {
  const h = await headers();
  const url = h.get("x-url") || "";
  try {
    return url ? new URL(url).pathname : "";
  } catch {
    return "";
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser(null as any);
  if (!user || String(user.role).toUpperCase() !== "ADMIN") redirect("/login");

  const pathname = await currentPath();

  return (
    <div className="erp-page">
      <header className="erp-topbar">
        <div className="erp-topbar-inner">
          <Link className="erp-brand" href="/admin/dashboard">
            한의N원외탕전 ERP
          </Link>

          <nav className="erp-nav">
            <Link href="/admin/dashboard" aria-current={pathname === "/admin/dashboard" ? "page" : undefined}>
              주문
            </Link>
            <Link href="/admin/items" aria-current={pathname.startsWith("/admin/items") ? "page" : undefined}>
              품목
            </Link>
            <Link href="/admin/clients" aria-current={pathname.startsWith("/admin/clients") ? "page" : undefined}>
              거래처/사업자등록증
            </Link>
            <Link href="/admin/stock" aria-current={pathname.startsWith("/admin/stock") ? "page" : undefined}>
              재고관리
            </Link>
          </nav>

          <form action="/api/auth/logout" method="post">
            <button className="erp-logout" type="submit">
              로그아웃
            </button>
          </form>
        </div>
      </header>

      {/* ✅ 관리자 페이지도 "흰 카드" 안에 */}
      <div className="erp-shell">
        <div className="erp-card">{children}</div>
      </div>
    </div>
  );
}