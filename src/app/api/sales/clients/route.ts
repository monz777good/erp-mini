import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSales } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const me = requireSales(req);

    const clients = await prisma.client.findMany({
      where: { salesId: me.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, clients });
  } catch (e: any) {
    const msg = String(e?.message ?? e);

    if (msg.startsWith("UNAUTHORIZED:")) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED", message: msg }, { status: 401 });
    }
    if (msg.startsWith("FORBIDDEN:")) {
      return NextResponse.json({ ok: false, code: "FORBIDDEN", message: msg }, { status: 403 });
    }

    return NextResponse.json({ ok: false, code: "SERVER_ERROR", message: msg }, { status: 500 });
  }
}