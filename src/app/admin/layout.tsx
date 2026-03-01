// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser(); // ✅ 인자 절대 넣지마

  if (!user || String(user.role).toUpperCase() !== "ADMIN") {
    redirect("/login");
  }

  return <>{children}</>;
}