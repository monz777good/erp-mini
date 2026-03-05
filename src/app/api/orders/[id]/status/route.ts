import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js 15: params Promise    await 
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const status = String(body.status ?? "").trim();

    if (!status) {
      return NextResponse.json(
        { ok: false, message: "status ." },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
    });

    return NextResponse.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: " " }, { status: 500 });
  }
}