import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/session";
import AdminTopNav from "@/components/admin/AdminTopNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminUser();
  if (!admin) redirect("/login?role=ADMIN");

  return (
    <div className="admin-bg">
      <div className="admin-wrap">
        <AdminTopNav />
        {/* ✅ 겉 큰 카드(erp-card) 제거: 각 페이지 내부 카드만 보이게 */}
        {children}
      </div>
    </div>
  );
}