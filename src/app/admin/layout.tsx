import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/session";
import AdminTopNav from "./AdminTopNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  if (!user) redirect("/login");

  return (
    <div className="admin-bg">
      <div className="admin-wrap">
        <AdminTopNav />
        {/* ✅ 여기서는 카드로 감싸지 않음: 각 페이지가 알아서 카드 렌더 */}
        {children}
      </div>
    </div>
  );
}