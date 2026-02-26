import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

async function requireUser(req: Request) {
  const user = await getSessionUser(req as any);
  return user ?? null;
}

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

function ymdKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ✅ 영업사원 주문 조회 (본인 것만)
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = (searchParams.get("q") || "").trim();
  const clientId = searchParams.get("clientId") || null;

  const where: any = { userId: user.id };

  if (clientId) where.clientId = clientId;

  if (from && to) {
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59`);
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      where.createdAt = { gte: fromDate, lte: toDate };
    }
  }

  if (q) {
    where.OR = [
      { receiverName: { contains: q } },
      { receiverAddr: { contains: q } },
      { item: { name: { contains: q } } },
      { client: { name: { contains: q } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, orders });
}

// ✅ 영업사원 장바구니 주문 생성 (여러 건 생성)
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, message: "BAD_BODY" }, { status: 400 });

  // ✅ 호환: (A) 장바구니형 { items:[{itemId,quantity}...] }
  // ✅ 호환: (B) 단일형 { itemId, quantity }
  const itemsInput = Array.isArray(body.items)
    ? body.items
    : body.itemId
      ? [{ itemId: body.itemId, quantity: body.quantity ?? 1 }]
      : [];

  const receiverName = String(body.receiverName ?? "").trim();
  const receiverAddr = String(body.receiverAddr ?? "").trim();
  const mobile = digitsOnly(body.mobile ?? body.receiverMobile ?? body.receiverMobile ?? body.receiverMobile);
  const phone = digitsOnly(body.phone ?? body.receiverPhone ?? "") || null;
  const message = String(body.message ?? "").trim() || null;
  const clientId = body.clientId ? String(body.clientId) : null;

  if (!receiverName) return NextResponse.json({ ok: false, message: "수하인 필요" }, { status: 400 });
  if (!receiverAddr) return NextResponse.json({ ok: false, message: "주소 필요" }, { status: 400 });
  if (!(mobile.length === 10 || mobile.length === 11)) {
    return NextResponse.json({ ok: false, message: "핸드폰 필요" }, { status: 400 });
  }
  if (!itemsInput.length) {
    return NextResponse.json({ ok: false, message: "품목 필요" }, { status: 400 });
  }

  // ✅ 내 거래처인지 검증 (clientId가 있으면)
  if (clientId) {
    const mine = await prisma.client.findFirst({
      where: { id: clientId, ownerUserId: user.id },
      select: { id: true },
    });
    if (!mine) return NextResponse.json({ ok: false, message: "거래처 권한 없음" }, { status: 403 });
  }

  // items 정리
  const cleanItems = itemsInput
    .map((r: any) => ({
      itemId: String(r?.itemId ?? ""),
      quantity: Math.max(1, Number(r?.quantity ?? 1) || 1),
    }))
    .filter((r: any) => !!r.itemId);

  if (cleanItems.length === 0) {
    return NextResponse.json({ ok: false, message: "품목 필요" }, { status: 400 });
  }

  // ✅ 한 번에 여러 row 생성
  // (트랜잭션으로 안정화)
  const created = await prisma.$transaction(
    cleanItems.map((r) =>
      prisma.order.create({
        data: {
          userId: user.id,
          itemId: r.itemId,
          quantity: r.quantity,
          status: "REQUESTED",
          receiverName,
          receiverAddr,
          mobile,
          phone,
          message,
          clientId,
          note: null,
        },
        select: { id: true },
      })
    )
  );

  return NextResponse.json({ ok: true, count: created.length });
}