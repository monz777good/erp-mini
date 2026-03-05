import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { OrderStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asOrderStatus(v: any): OrderStatus | null {
  const s = String(v ?? "").toUpperCase();
  if (s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "DONE") return OrderStatus.DONE;
  return null;
}

/**
 * ✅ 주문 조회 (너가 준 GET 그대로)
 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = asOrderStatus(url.searchParams.get("status"));
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to = url.searchParams.get("to"); // YYYY-MM-DD

  const createdAt: any = {};
  if (from) createdAt.gte = new Date(from);
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    createdAt.lte = d;
  }

  const where: any = {};
  if (status) where.status = status;
  if (from || to) where.createdAt = createdAt;

  if (user.role !== Role.ADMIN) {
    where.userId = user.id;
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      item: true,
      user: { select: { id: true, name: true, phone: true, role: true } },
    },
  });

  return NextResponse.json({ ok: true, rows, orders: rows });
}

/**
 * ✅ 주문 요청(추가)
 * 프론트에서 이렇게 보냄:
 * {
 *  clientId, itemId, quantity,
 *  receiverName, receiverAddr, phone, mobile, note
 * }
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const clientId = String(body?.clientId ?? "").trim();
  const itemId = String(body?.itemId ?? "").trim();
  const quantity = Number(body?.quantity ?? 0);

  if (!clientId) {
    return NextResponse.json({ ok: false, error: "CLIENT_REQUIRED" }, { status: 400 });
  }
  if (!itemId) {
    return NextResponse.json({ ok: false, error: "ITEM_REQUIRED" }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ ok: false, error: "BAD_QUANTITY" }, { status: 400 });
  }

  // ✅ 배송정보(없으면 거래처 기본값으로 자동 채움)
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      receiverName: true,
      receiverAddr: true,
      receiverTel: true,
      receiverMobile: true,
      memo: true,
    },
  });

  if (!client) {
    return NextResponse.json({ ok: false, error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  const receiverName = String(body?.receiverName ?? client.receiverName ?? "").trim();
  const receiverAddr = String(body?.receiverAddr ?? client.receiverAddr ?? "").trim();
  const phone = String(body?.phone ?? client.receiverTel ?? "").trim();
  const mobile = String(body?.mobile ?? client.receiverMobile ?? "").trim();
  const note = String(body?.note ?? client.memo ?? "").trim();

  if (!receiverName || !receiverAddr) {
    return NextResponse.json(
      { ok: false, error: "RECEIVER_INFO_REQUIRED" },
      { status: 400 }
    );
  }

  // ✅ 주문 생성
  // (Order 모델에 아래 필드들이 있어야 함)
  // userId, clientId, itemId, quantity, status, receiverName, receiverAddr, phone, mobile, note
  const created = await prisma.order.create({
    data: {
      userId: user.id,
      clientId,
      itemId,
      quantity,
      status: OrderStatus.REQUESTED,

      receiverName,
      receiverAddr,
      phone: phone || null,
      mobile: mobile || null,
      note: note || null,
    } as any,
    include: {
      client: true,
      item: true,
      user: { select: { id: true, name: true, phone: true, role: true } },
    },
  });

  return NextResponse.json({ ok: true, order: created });
}