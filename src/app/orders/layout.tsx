import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OrdersLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <div className="min-h-dvh w-full overflow-x-hidden">
      {/* ✅ 고급 다크 배경 고정 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-500/25 blur-[120px]" />
        <div className="absolute top-10 -right-40 h-[560px] w-[560px] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute -bottom-56 left-1/4 h-[620px] w-[620px] rounded-full bg-fuchsia-500/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_10%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(900px_600px_at_80%_20%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(800px_600px_at_60%_90%,rgba(255,255,255,0.05),transparent_55%)]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}