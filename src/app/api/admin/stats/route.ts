import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

/** YYYY-MM-DD -> 로컬 기준 하루 시작/끝 */
function toStartOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}
function toEndOfDay(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999`);
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, message: "관리자만" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = String(searchParams.get("from") ?? "").trim();
  const to = String(searchParams.get("to") ?? "").trim();

  // 기간이 비면 "전체기간" 통계
  const hasRange = !!from && !!to;

  const whereRange: any = {};
  if (hasRange) {
    whereRange.createdAt = {
      gte: toStartOfDay(from),
      lte: toEndOfDay(to),
    };
  }

  // ✅ 승인/출고완료 = 실제 “나간 건”
  // ✅ 핵심: readonly(as const) 제거 + string[]로 고정
  const SHIPPED_STATUSES: string[] = ["APPROVED", "DONE"];

  const shippedWhereAllTime: any = {
    status: { in: SHIPPED_STATUSES },
  };

  const shippedWhereInRange: any = {
    ...shippedWhereAllTime,
    ...(hasRange ? whereRange : {}),
  };

  // 1) 총 승인/출고완료 건수(전체)
  const totalApprovedAll = await prisma.order.count({
    where: shippedWhereAllTime,
  });

  // 2) 기간 내 승인/출고완료 건수
  const totalApprovedInRange = await prisma.order.count({
    where: shippedWhereInRange,
  });

  // 3) 기간 내 품목별 TOP (수량 합 기준)
  const grouped = await prisma.order.groupBy({
    by: ["itemId"],
    where: shippedWhereInRange,
    _sum: { quantity: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const itemIds = grouped.map((g) => g.itemId);

  const items = itemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, name: true },
      })
    : [];

  const idToName = new Map(items.map((it) => [it.id, it.name]));

  const topItems = grouped.map((g) => ({
    itemId: g.itemId,
    itemName: idToName.get(g.itemId) ?? "(삭제된 품목)",
    totalQty: Number(g._sum.quantity ?? 0),
    orderCount: Number(g._count._all ?? 0),
  }));

  return NextResponse.json({
    ok: true,
    range: hasRange ? { from, to } : null,
    totalApprovedAll,
    totalApprovedInRange,
    topItems,
  });
}