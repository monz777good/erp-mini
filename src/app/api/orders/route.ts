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

// ✅ (구버전) 단일 주문 생성도 받고, (신버전) items 배열도 받게 호환
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, message: "BAD_BODY" }, { status: 400 });

  // ✅ 호환 필드명들 다 받기
  const receiverName = String(body.receiverName ?? "").trim();
  const receiverAddr = String(body.receiverAddr ?? "").trim();

  // 여기 핵심: 프론트가 receiverMobile로 보내든 mobile로 보내든 OK
  const mobile = digitsOnly(body.mobile ?? body.receiverMobile ?? "");
  const phone = digitsOnly(body.phone ?? body.receiverPhone ?? "") || null;

  const message = String(body.message ?? "").trim() || null;
  const clientId = body.clientId ? String(body.clientId) : null;

  if (!receiverName) return NextResponse.json({ ok: false, message: "수하인 필요" }, { status: 400 });
  if (!receiverAddr) return NextResponse.json({ ok: false, message: "주소 필요" }, { status: 400 });
  if (!(mobile.length === 10 || mobile.length === 11)) {
    return NextResponse.json({ ok: false, message: "핸드폰 필요" }, { status: 400 });
  }

  // ✅ 단일 or 장바구니
  const itemsInput = Array.isArray(body.items)
    ? body.items
    : body.itemId
      ? [{ itemId: body.itemId, quantity: body.quantity ?? 1 }]
      : [];

  const cleanItems = itemsInput
    .map((r: any) => ({
      itemId: String(r?.itemId ?? ""),
      quantity: Math.max(1, Number(r?.quantity ?? 1) || 1),
    }))
    .filter((r: any) => !!r.itemId);

  if (!cleanItems.length) {
    return NextResponse.json({ ok: false, message: "품목 필요" }, { status: 400 });
  }

  // ✅ 내 거래처인지 검증(있으면)
  if (clientId) {
    const mine = await prisma.client.findFirst({
      where: { id: clientId, ownerUserId: user.id },
      select: { id: true },
    });
    if (!mine) return NextResponse.json({ ok: false, message: "거래처 권한 없음" }, { status: 403 });
  }

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