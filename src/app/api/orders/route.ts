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

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const where: any = {};

  // ✅ SALES는 본인 주문만 / ADMIN은 전체
  if (user.role === "SALES") {
    where.user = { id: user.id };
  }

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
      client: { select: { id: true, name: true } },
      item: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, orders });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "BAD_JSON" }, { status: 400 });

  const clientId = String(body.clientId ?? "");
  const itemId = String(body.itemId ?? "");
  const quantity = Number(body.quantity ?? 0);

  const receiverName = String(body.receiverName ?? "").trim();
  const receiverAddr = String(body.receiverAddr ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const mobile = String(body.mobile ?? "").trim();
  const note = String(body.note ?? "").trim();

  if (!clientId) return NextResponse.json({ ok: false, error: "CLIENT_REQUIRED" }, { status: 400 });
  if (!itemId) return NextResponse.json({ ok: false, error: "ITEM_REQUIRED" }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0)
    return NextResponse.json({ ok: false, error: "QUANTITY_INVALID" }, { status: 400 });
  if (!receiverName) return NextResponse.json({ ok: false, error: "RECEIVER_NAME_REQUIRED" }, { status: 400 });
  if (!receiverAddr) return NextResponse.json({ ok: false, error: "RECEIVER_ADDR_REQUIRED" }, { status: 400 });

  // ✅ FK 컬럼명이 뭐든 상관없이 "관계 connect"로만 저장
  const created = await prisma.order.create({
    data: {
      status: OrderStatus.REQUESTED,
      quantity,
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
      client: { select: { id: true, name: true } },
      item: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, order: created });
}