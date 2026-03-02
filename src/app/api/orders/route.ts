import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

// ✅ 주문 목록 조회
// - 기본: 전체(ADMIN만)
// - SALES는 본인 주문만
// - status 필터 가능
export async function GET(req: Request) {
  try {
    const me = await getSessionUser(req as any);
    if (!me) {
      return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
    }

    const role = String((me as any).role ?? "").toUpperCase();
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status")?.trim() || "") as any;

    const where: any = {};
    if (status) where.status = status;

    // ✅ SALES는 본인 주문만
    if (role !== "ADMIN") {
      where.userId = (me as any).id;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        item: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, phone: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}

// ✅ 주문 생성 (ADMIN/SALES 모두 가능)
// - userId는 세션에서 자동
export async function POST(req: Request) {
  try {
    const me = await getSessionUser(req as any);
    if (!me) {
      return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const itemId = String(body?.itemId ?? "").trim();
    const quantity = Number(body?.quantity ?? 1);
    const note = body?.note ? String(body.note) : null;

    const receiverName = String(body?.receiverName ?? "").trim();
    const receiverAddr = String(body?.receiverAddr ?? "").trim();
    const receiverPhone = String(body?.receiverPhone ?? "").trim();

    const clientId = body?.clientId ? String(body.clientId).trim() : "";

    if (!itemId) {
      return NextResponse.json({ ok: false, message: "itemId가 필요합니다." }, { status: 400 });
    }
    if (!receiverName || !receiverAddr) {
      return NextResponse.json(
        { ok: false, message: "수하인 이름/주소가 필요합니다." },
        { status: 400 }
      );
    }

    // clientId가 있으면 존재만 확인(스키마가 관계필드 달라도 안전)
    if (clientId) {
      const ok = await prisma.client.findFirst({
        where: { id: clientId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json({ ok: false, message: "거래처를 찾을 수 없습니다." }, { status: 404 });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: (me as any).id,
        itemId,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        status: "REQUESTED",
        note,
        receiverName,
        receiverAddr,
        receiverPhone,
        ...(clientId ? { clientId } : {}),
      } as any,
      include: {
        item: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, phone: true, role: true } },
      },
    });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}