import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/session";
import AdminTopNav from "./AdminTopNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  if (!user) redirect("/login");

  return (
    <div className="erp-shell">
      <div style={{ width: "min(1100px, 100%)" }}>
        <AdminTopNav />
        <div className="erp-card">{children}</div>
      </div>
    </div>
  );
}