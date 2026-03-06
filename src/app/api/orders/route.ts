// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function s(v: any) {
  return String(v ?? "").trim();
}

function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

// ✅ KST(한국시간) 기준 날짜 문자열(YYYY-MM-DD)을 UTC Date 범위로 변환
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const { searchParams } = new URL(req.url);

  const fromYmd = s(searchParams.get("from")) || "";
  const toYmd = s(searchParams.get("to")) || "";
  const q = s(searchParams.get("q")) || "";

  if (!fromYmd || !toYmd) return err("DATE_REQUIRED", 400);

  const { from, to } = kstRange(fromYmd, toYmd);

  // ✅ SALES는 본인 주문만, ADMIN은 전체
  const where: any = {
    createdAt: { gte: from, lte: to },
    ...(me.role === "ADMIN" ? {} : { userId: me.id }),
  };

  // ✅ 검색(거래처/수하인/주소/전화/비고/품목명)
  if (q) {
    where.OR = [
      { receiverName: { contains: q, mode: "insensitive" } },
      { receiverAddr: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q, mode: "insensitive" } },
      { note: { contains: q, mode: "insensitive" } },
      { client: { is: { name: { contains: q, mode: "insensitive" } } } },
      { item: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      quantity: true,

      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      note: true,

      client: { select: { name: true } },
      item: { select: { name: true } },
    },
  });

  const orders = rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    quantity: r.quantity ?? 0,

    clientName: r.client?.name ?? null,
    itemName: r.item?.name ?? null,

    receiverName: r.receiverName ?? null,
    receiverAddr: r.receiverAddr ?? null,
    phone: r.phone ?? null,
    mobile: r.mobile ?? null,
    note: r.note ?? null,
  }));

  return NextResponse.json({ ok: true, orders });
}

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("BAD_REQUEST", 400);
  }

  const clientId = s(body.clientId);
  const receiverName = s(body.receiverName);
  const receiverAddr = s(body.receiverAddr);
  const phone = s(body.phone) || null;
  const mobile = s(body.mobile) || null;
  const note = s(body.note) || null;

  if (!clientId) return err("CLIENT_REQUIRED", 400);
  if (!receiverName) return err("RECEIVER_NAME_REQUIRED", 400);
  if (!receiverAddr) return err("RECEIVER_ADDR_REQUIRED", 400);

  // ✅ 프론트가 cart/items 배열로 보내는 경우도 받고
  // ✅ itemId, quantity 단건으로 보내는 경우도 같이 받음
  const rawItems = Array.isArray(body.items)
    ? body.items
    : Array.isArray(body.cart)
    ? body.cart
    : body.itemId
    ? [{ itemId: body.itemId, quantity: body.quantity }]
    : [];

  const items = rawItems
    .map((x: any) => ({
      itemId: s(x.itemId ?? x.id ?? x.item?.id),
      quantity: n(x.quantity),
    }))
    .filter((x: any) => x.itemId && x.quantity > 0);

  if (!items.length) return err("ITEM_REQUIRED", 400);

  const created = await prisma.$transaction(
    items.map((x: { itemId: string; quantity: number }) =>
      prisma.order.create({
        data: {
          userId: me.id,
          clientId,
          itemId: x.itemId,
          quantity: x.quantity,

          receiverName,
          receiverAddr,
          phone,
          mobile,
          note,

          status: OrderStatus.REQUESTED,
        },
      })
    )
  );

  return NextResponse.json({
    ok: true,
    count: created.length,
    rows: created,
  });
}