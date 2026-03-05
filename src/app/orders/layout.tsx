import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OrdersLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/login");

  // ✅ SALES/ADMIN 모두 접근 가능
  return <>{children}</>;
}