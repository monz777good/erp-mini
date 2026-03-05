import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminTopNav from "@/components/admin/AdminTopNav";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // 로그인 안 되어있으면 로그인으로
  if (!session.user) redirect("/");

  // 관리자 아니면 영업 화면으로
  if (session.user.role !== "ADMIN") redirect("/orders");

  return (
    <div className="min-h-dvh">
      <AdminTopNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}