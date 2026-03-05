import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

//    (  ) 
// - / : Client ownerUserId  " "  
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const userId = String(body?.userId ?? "").trim();
    const itemId = String(body?.itemId ?? "").trim();
    const clientId = body?.clientId ? String(body.clientId).trim() : "";
    const quantity = Number(body?.quantity ?? 1);
    const note = body?.note ? String(body.note) : null;

    //   (  )
    const receiverName = String(body?.receiverName ?? "").trim();
    const receiverAddr = String(body?.receiverAddr ?? "").trim();
    const receiverPhone = String(body?.receiverPhone ?? "").trim();
    const receiverMobile = String(body?.receiverMobile ?? "").trim();
    const boxCount = Number(body?.boxCount ?? 1);

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

    //  clientId    (ownerUserId   =   )
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

    //    (status schema.prisma OrderStatus )
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

        // clientId  Order    ,
        // /    "" .
        ...(clientId ? { clientId } : {}),
      } as any, //      ( clientId   )
      select: { id: true },
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: " " },
      { status: 500 }
    );
  }
}