// src/app/admin/layout.tsx
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

async function currentPath() {
  // ✅ Next.js 16: headers()는 Promise라서 await 필요
  const h = await headers();

  // x-url이 없을 수도 있으니 방어적으로 처리
  const url = h.get("x-url") || "";

  try {
    return url ? new URL(url).pathname : "";
  } catch {
    return "";
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser(null as any);

  if (!user || String(user.role).toUpperCase() !== "ADMIN") {
    redirect("/login");
  }

  const pathname = await currentPath();

  return (
    <div className="erp-page">
      <div className="erp-topbar">
        <div className="erp-topbar-inner">
          <Link className="erp-brand" href="/admin/dashboard">
            한의N원외탕전
          </Link>

          <nav className="erp-nav">
            <Link href="/admin/dashboard" aria-current={pathname === "/admin/dashboard" ? "page" : undefined}>
              대시보드
            </Link>
            <Link href="/admin/orders" aria-current={pathname.startsWith("/admin/orders") ? "page" : undefined}>
              관리자 주문
            </Link>
            <Link href="/admin/items" aria-current={pathname.startsWith("/admin/items") ? "page" : undefined}>
              품목관리
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
      </div>

      <div className="erp-container">{children}</div>
    </div>
  );
}