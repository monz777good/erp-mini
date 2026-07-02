import type { ReactNode } from "react";
import AdminTopNav from "@/components/AdminTopNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="admin-scope min-h-[100svh] w-full px-3 py-4 sm:px-4 sm:py-6"
      style={{
        background:
          "linear-gradient(180deg, #f7fbf7 0%, #edf7ef 48%, #f9fffb 100%)",
      }}
    >
      <div className="w-full max-w-[1600px] mx-auto rounded-2xl border border-emerald-100 bg-white shadow-[0_20px_70px_rgba(22,101,52,0.10)]">
        <div className="p-4 md:p-6">
          <AdminTopNav />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
