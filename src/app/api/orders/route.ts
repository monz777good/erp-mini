import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toDateStart(v: string) {
  const [y, m, d] = v.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
function toDateEnd(v: string) {
  const [y, m, d] = v.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function s(v: any) {
  return String(v ?? "").trim();
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const where: any = {};
  if (user.role === "SALES") where.user = { id: user.id };

  if (from && to) {
    const ds = toDateStart(from);
    const de = toDateEnd(to);
    if (ds && de) where.createdAt = { gte: ds, lte: de };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      quantity: true,
      createdAt: true,
      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      note: true,
      client: {
        select: {
          id: true,
          name: true,
          ownerName: true,
          address: true,
          receiverTel: true,
          receiverMobile: true,
        },
      },
      item: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, orders });
}

type CartLine = { itemId: string; quantity: number };

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "BAD_JSON" }, { status: 400 });

  const clientId = s(body.clientId);

  const receiverName = s(body.receiverName);
  const receiverAddr = s(body.receiverAddr);
  const phone = s(body.phone);
  const mobile = s(body.mobile);
  const note = s(body.note);

  if (!clientId) return NextResponse.json({ ok: false, error: "CLIENT_REQUIRED" }, { status: 400 });
  if (!receiverName) return NextResponse.json({ ok: false, error: "RECEIVER_NAME_REQUIRED" }, { status: 400 });
  if (!receiverAddr) return NextResponse.json({ ok: false, error: "RECEIVER_ADDR_REQUIRED" }, { status: 400 });

  // ✅ (1) 장바구니(복수 품목) 지원: body.items = [{ itemId, quantity }, ...]
  const itemsArr = Array.isArray(body.items) ? (body.items as CartLine[]) : null;

  if (itemsArr && itemsArr.length > 0) {
    const cleaned: CartLine[] = itemsArr
      .map((x) => ({ itemId: s((x as any)?.itemId), quantity: Number((x as any)?.quantity ?? 0) }))
      .filter((x) => x.itemId && Number.isFinite(x.quantity) && x.quantity > 0)
      .map((x) => ({ itemId: x.itemId, quantity: Math.floor(x.quantity) }));

    if (cleaned.length === 0) {
      return NextResponse.json({ ok: false, error: "ITEMS_INVALID" }, { status: 400 });
    }

    const createdOrders = await prisma.$transaction(async (tx) => {
      // ✅ 핵심 수정: out이 never[]로 추론되지 않게 타입 지정
      const out: any[] = [];

      for (const line of cleaned) {
        const created = await tx.order.create({
          data: {
            status: OrderStatus.REQUESTED,
            quantity: line.quantity,
            receiverName,
            receiverAddr,
            phone: phone || null,
            mobile: mobile || null,
            note: note || null,
            user: { connect: { id: user.id } },
            client: { connect: { id: clientId } },
            item: { connect: { id: line.itemId } },
          },
          select: {
            id: true,
            status: true,
            quantity: true,
            createdAt: true,
            receiverName: true,
            receiverAddr: true,
            phone: true,
            mobile: true,
            note: true,
            client: {
              select: {
                id: true,
                name: true,
                ownerName: true,
                address: true,
                receiverTel: true,
                receiverMobile: true,
              },
            },
            item: { select: { id: true, name: true } },
          },
        });

        out.push(created);
      }

      return out;
    });

    return NextResponse.json({ ok: true, orders: createdOrders });
  }

  // ✅ (2) 기존 단품 주문(호환 유지)
  const itemId = s(body.itemId);
  const quantity = Number(body.quantity ?? 0);

  if (!itemId) return NextResponse.json({ ok: false, error: "ITEM_REQUIRED" }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0)
    return NextResponse.json({ ok: false, error: "QUANTITY_INVALID" }, { status: 400 });

  const created = await prisma.order.create({
    data: {
      status: OrderStatus.REQUESTED,
      quantity: Math.floor(quantity),
      receiverName,
      receiverAddr,
      phone: phone || null,
      mobile: mobile || null,
      note: note || null,
      user: { connect: { id: user.id } },
      client: { connect: { id: clientId } },
      item: { connect: { id: itemId } },
    },
    select: {
      id: true,
      status: true,
      quantity: true,
      createdAt: true,
      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      note: true,
      client: {
        select: {
          id: true,
          name: true,
          ownerName: true,
          address: true,
          receiverTel: true,
          receiverMobile: true,
        },
      },
      item: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, order: created });
}