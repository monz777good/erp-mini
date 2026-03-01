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
        <div className="erp-card">{children}</div>
      </div>
    </div>
  );
}
