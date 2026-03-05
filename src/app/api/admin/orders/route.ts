// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function s(v: any) {
  return String(v ?? "").trim();
}

// ✅ KST(한국시간) 기준 날짜 문자열(YYYY-MM-DD)을 UTC Date 범위로 변환
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

type GroupRow = {
  id: string; // 대표 주문 id (프론트가 이걸로 /api/admin/orders/<id> 호출 가능)
  createdAt: string;
  status: string;

  userName: string;
  userPhone: string;

  clientName: string;
  clientId: string;

  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;
  note?: string | null;

  items: { itemId: string; itemName: string; quantity: number }[];
  orderIds: string[];
};

function makeGroupKey(o: any) {
  return [
    o.createdAt?.toISOString?.() ?? String(o.createdAt),
    o.userId,
    o.clientId,
    s(o.receiverName),
    s(o.receiverAddr),
    s(o.phone),
    s(o.mobile),
    s(o.note),
  ].join("|");
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const from = s(url.searchParams.get("from"));
  const to = s(url.searchParams.get("to"));
  const status = s(url.searchParams.get("status")); // REQUESTED/APPROVED/REJECTED/DONE
  const q = s(url.searchParams.get("q"));

  let createdAt: any = undefined;
  if (from && to) {
    const r = kstRange(from, to);
    createdAt = { gte: r.from, lte: r.to };
  }

  const where: any = {};
  if (createdAt) where.createdAt = createdAt;
  if (status) where.status = status as OrderStatus;

  if (q) {
    where.OR = [
      { receiverName: { contains: q, mode: "insensitive" } },
      { receiverAddr: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { mobile: { contains: q } },
      { note: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { item: { name: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      client: { select: { id: true, name: true } },
      item: { select: { id: true, name: true } },
    },
    take: 2000,
  });

  // ✅ groupId 없이 createdAt 묶음으로 그룹핑
  const map = new Map<string, GroupRow>();

  for (const o of orders) {
    const key = makeGroupKey(o);

    if (!map.has(key)) {
      map.set(key, {
        id: o.id, // 대표 id
        createdAt: o.createdAt.toISOString(),
        status: o.status,
        userName: o.user?.name ?? "",
        userPhone: o.user?.phone ?? "",
        clientName: o.client?.name ?? "",
        clientId: o.client?.id ?? "",
        receiverName: o.receiverName ?? "",
        receiverAddr: o.receiverAddr ?? "",
        phone: o.phone ?? null,
        mobile: o.mobile ?? null,
        note: o.note ?? null,
        items: [],
        orderIds: [],
      });
    }

    const g = map.get(key)!;
    g.orderIds.push(o.id);

    // ✅ 같은 품목이면 수량 합산해서 itemName + xN 만들기
    const found = g.items.find((it) => it.itemId === o.itemId);
    if (found) found.quantity += o.quantity ?? 1;
    else
      g.items.push({
        itemId: o.itemId,
        itemName: o.item?.name ?? "",
        quantity: o.quantity ?? 1,
      });
  }

  const rows = Array.from(map.values());

  return NextResponse.json({ ok: true, rows });
}

// ✅ (프론트가 /api/admin/orders 로 PATCH 때릴 때도 지원)
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("BAD_REQUEST");
  }

  const status = s(body.status) as OrderStatus;
  if (!["APPROVED", "REJECTED", "DONE", "REQUESTED"].includes(status)) {
    return err("INVALID_STATUS");
  }

  // 1) orderIds 배열로 오면 그대로 updateMany
  if (Array.isArray(body.orderIds) && body.orderIds.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: body.orderIds.map((x: any) => s(x)).filter(Boolean) } },
      data: { status },
    });
    return NextResponse.json({ ok: true });
  }

  // 2) id 1개만 오면 그 id 기준으로 묶음 업데이트
  const id = s(body.id);
  if (!id) return err("ORDER_REQUIRED");

  const base = await prisma.order.findUnique({
    where: { id },
    select: {
      createdAt: true,
      userId: true,
      clientId: true,
      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      note: true,
    },
  });
  if (!base) return err("NOT_FOUND", 404);

  await prisma.order.updateMany({
    where: {
      createdAt: base.createdAt,
      userId: base.userId,
      clientId: base.clientId,
      receiverName: base.receiverName,
      receiverAddr: base.receiverAddr,
      phone: base.phone,
      mobile: base.mobile,
      note: base.note,
    },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}