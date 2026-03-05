// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function s(v: any) {
  return String(v ?? "").trim();
}

// ✅ KST 기준 YYYY-MM-DD → UTC Date 범위
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

type BodyItem = { itemId: string; quantity?: number };

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const from = s(url.searchParams.get("from"));
  const to = s(url.searchParams.get("to"));
  const status = s(url.searchParams.get("status")); // REQUESTED/APPROVED/REJECTED/DONE
  const q = s(url.searchParams.get("q"));

  // 기본: 최근 7일
  let range = undefined as undefined | { gte: Date; lte: Date };
  if (from && to) {
    const r = kstRange(from, to);
    range = { gte: r.from, lte: r.to };
  }

  const where: any = {
    userId: user.id,
  };

  if (range) where.createdAt = range;
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
    ];
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      item: true,
      client: true,
    },
    take: 500,
  });

  return NextResponse.json({ ok: true, rows });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("BAD_REQUEST");
  }

  const clientId = s(body.clientId);
  const receiverName = s(body.receiverName);
  const receiverAddr = s(body.receiverAddr);
  const phone = s(body.phone) || null;
  const mobile = s(body.mobile) || null;
  const note = s(body.note) || null;

  // ✅ 1) 장바구니 형태: items: [{itemId, quantity}]
  const itemsFromArray: BodyItem[] = Array.isArray(body.items) ? body.items : [];

  // ✅ 2) 단일 형태(호환): itemId + quantity
  const singleItemId = s(body.itemId);
  const singleQty = Number(body.quantity ?? 1);

  let items: { itemId: string; quantity: number }[] = [];

  if (itemsFromArray.length > 0) {
    items = itemsFromArray
      .map((it) => ({
        itemId: s(it.itemId),
        quantity: Math.max(1, Number(it.quantity ?? 1) || 1),
      }))
      .filter((it) => !!it.itemId);
  } else if (singleItemId) {
    items = [
      {
        itemId: singleItemId,
        quantity: Math.max(1, Number.isFinite(singleQty) ? singleQty : 1),
      },
    ];
  }

  if (!clientId) return err("CLIENT_REQUIRED");
  if (!receiverName) return err("RECEIVER_NAME_REQUIRED");
  if (!receiverAddr) return err("RECEIVER_ADDR_REQUIRED");

  // ✅ 여기서만 ITEM_REQUIRED (진짜 아이템이 없을 때)
  if (items.length === 0) return err("ITEM_REQUIRED");

  // ✅ 장바구니 “한 번 주문” 묶음을 위해 createdAt 동일하게 고정
  const createdAt = new Date();

  await prisma.order.createMany({
    data: items.map((it) => ({
      userId: user.id,
      clientId,
      itemId: it.itemId,
      quantity: it.quantity,

      receiverName,
      receiverAddr,
      phone,
      mobile,
      note,

      status: OrderStatus.REQUESTED,
      createdAt,
    })),
  });

  return NextResponse.json({ ok: true });
}