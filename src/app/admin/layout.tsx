// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import AdminTopNav from "@/components/admin/AdminTopNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // ✅ 권한 체크는 middleware가 담당 (layout에서 세션 검사 금지)
  return (
    <div className="admin-bg">
      <div className="admin-wrap">
        <AdminTopNav />
        {children}
      </div>
    </div>
  );
}