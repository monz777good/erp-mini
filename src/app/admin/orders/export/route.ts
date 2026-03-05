import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ✅ 세션/권한 체크: req/res 절대 넣지 말 것
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const from = url.searchParams.get("from"); // 예: 2026-03-01
  const to = url.searchParams.get("to");     // 예: 2026-03-02

  // 날짜 필터(옵션)
  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      // to는 보통 "해당일 23:59:59"까지 포함시키고 싶어서 +1day 처리
      const end = new Date(to);
      end.setDate(end.getDate() + 1);
      where.createdAt.lt = end;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      item: true,
      client: true,
    },
  });

  return NextResponse.json({ ok: true, orders });
}