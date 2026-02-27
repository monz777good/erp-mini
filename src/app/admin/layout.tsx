import AdminTopNav from "@/components/AdminTopNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ✅ 배경 오버레이 (전체 공통) */}
      <div className="erp-bg-overlay" />
      <AdminTopNav />
      <main className="erp-container">{children}</main>
    </>
  );
}