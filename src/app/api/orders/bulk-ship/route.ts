import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

//    "DONE()"  
// - REQUESTED(/)  APPROVED()  
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderIds = Array.isArray(body?.orderIds) ? body.orderIds : [];

    if (orderIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: "orderIds ." },
        { status: 400 }
      );
    }

    //  PENDING    
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        status: { in: ["REQUESTED", "APPROVED"] }, //  schema.prisma OrderStatus 
      },
      data: { status: "DONE" },
    });

    return NextResponse.json({ ok: true, updatedCount: result.count });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: " " },
      { status: 500 }
    );
  }
}