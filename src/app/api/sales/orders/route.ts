import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 *    API (/  )
 * - ownerUserId(  )  
 * - GET:    ( )
 * - POST:   
 *
 * status enum( ):
 *   REQUESTED / APPROVED / REJECTED / DONE
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = (searchParams.get("userId") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

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
    return NextResponse.json(
      { ok: false, message: " " },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const userId = String(body?.userId ?? "").trim();
    const itemId = String(body?.itemId ?? "").trim();
    const quantity = Number(body?.quantity ?? 1);
    const note = body?.note ? String(body.note) : null;

    const receiverName = String(body?.receiverName ?? "").trim();
    const receiverAddr = String(body?.receiverAddr ?? "").trim();
    const receiverPhone = String(body?.receiverPhone ?? "").trim();
    const receiverMobile = String(body?.receiverMobile ?? "").trim();
    const boxCount = Number(body?.boxCount ?? 1);

    const clientId = body?.clientId ? String(body.clientId).trim() : "";

    if (!userId || !itemId) {
      return NextResponse.json(
        { ok: false, message: "userId, itemId ." },
        { status: 400 }
      );
    }

    if (!receiverName || !receiverAddr) {
      return NextResponse.json(
        { ok: false, message: " / ." },
        { status: 400 }
      );
    }

    //  clientId    (ownerUserId  )
    if (clientId) {
      const ok = await prisma.client.findFirst({
        where: { id: clientId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json(
          { ok: false, message: "   ." },
          { status: 404 }
        );
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        itemId,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        status: "REQUESTED",
        note,

        receiverName,
        receiverAddr,
        receiverPhone,
        receiverMobile,
        boxCount: Number.isFinite(boxCount) && boxCount > 0 ? boxCount : 1,

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
    return NextResponse.json(
      { ok: false, message: " " },
      { status: 500 }
    );
  }
}