import type { ReactNode } from "react";
import AdminTopNav from "@/components/AdminTopNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="admin-scope min-h-[100svh] w-full px-4 py-6"
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 20%, rgba(120,105,255,0.22), transparent 55%), radial-gradient(900px 600px at 80% 30%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(900px 700px at 50% 90%, rgba(255,255,255,0.08), transparent 55%), linear-gradient(180deg, rgb(8,10,18), rgb(12,14,24))",
      }}
    >
      <div className="w-full max-w-6xl mx-auto rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="p-6 md:p-8">
          <AdminTopNav />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}