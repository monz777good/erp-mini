import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, item: true },
  });

  const data = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    요청자명: o.user?.name ?? "",
    전화번호: o.user?.phone ?? "",
    배송지주소: (o as any).receiverAddr ?? "",
    수하인명: (o as any).receiverName ?? "",
    요청사항: o.note ?? "",
    상태: o.status ?? "",
    품목: o.item?.name ?? "",
    수량: (o as any).quantity ?? 0,
  }));

  return NextResponse.json(data);
}
