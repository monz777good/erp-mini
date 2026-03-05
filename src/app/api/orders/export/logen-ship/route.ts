import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 *   ( ) 
 * -  /  
 * - OrderStatus enum  "SHIPPED"    "DONE" 
 *
 *  :
 *   REQUESTED / APPROVED / REJECTED / DONE
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    //   orderIds   (  )
    const orderIds: string[] = Array.isArray(body?.orderIds) ? body.orderIds : [];

    //  1)   : (APPROVED)
    const orders = await prisma.order.findMany({
      where: orderIds.length
        ? { id: { in: orderIds }, status: "APPROVED" }
        : { status: "APPROVED" },
      include: {
        item: { select: { name: true } },
        user: { select: { name: true, phone: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    //  2)   " " 
    // (  /  1,   /   )
    const rows = orders.map((o) => {
      //  (: receiverPhone/receiverMobile/boxCount )
      //       
      const receiverName = (o as any).receiverName ?? "";
      const receiverAddr = (o as any).receiverAddr ?? "";
      const receiverPhone = (o as any).receiverPhone ?? "";
      const receiverMobile = (o as any).receiverMobile ?? "";
      const boxCount = (o as any).boxCount ?? 1;
      const shipFee = 3850;

      return {
        //   : A1=Y, A2    
        //      ,
        //  " " 
        y: "y",
        receiverName,
        receiverAddr,
        receiverPhone,
        receiverMobile,
        boxCount,
        shipFee,
        fareType: "",
        itemName: o.item?.name ?? "",
        message: (o as any).note ?? "",
        orderId: o.id,
      };
    });

    //  3)  : SHIPPED   DONE 
    if (orders.length) {
      await prisma.order.updateMany({
        where: { id: { in: orders.map((o) => o.id) } },
        data: { status: "DONE" },
      });
    }

    return NextResponse.json({ ok: true, count: orders.length, rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: " " },
      { status: 500 }
    );
  }
}