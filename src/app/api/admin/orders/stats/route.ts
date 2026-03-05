import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {
    status: { in: ["APPROVED", "DONE"] },
  };

  if (from && to) {
    where.createdAt = {
      gte: new Date(from + "T00:00:00"),
      lte: new Date(to + "T23:59:59"),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { item: true },
  });

  //   (/) 
  const totalCount = await prisma.order.count({
    where: { status: { in: ["APPROVED", "DONE"] } },
  });

  //    
  const periodCount = orders.length;

  //   
  const itemMap: Record<string, { qty: number; count: number }> = {};

  for (const o of orders) {
    const name = o.item?.name ?? "";
    if (!itemMap[name]) itemMap[name] = { qty: 0, count: 0 };
    itemMap[name].qty += Number(o.quantity ?? 0);
    itemMap[name].count += 1;
  }

  const topItems = Object.entries(itemMap)
    .map(([name, v]) => ({ name, qty: v.qty, count: v.count }))
    .sort((a, b) => b.qty - a.qty);

  return NextResponse.json({
    ok: true,
    periodCount,
    totalCount,
    topItems,
  });
}
