import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    requireAdmin();

    const p = await ctx.params; // Promise object 
    const id = p?.id;

    if (!id) {
      return NextResponse.json({ ok: false, message: "id " }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, phone: true, role: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, message: " " }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order });
  } catch (e: any) {
    if (String(e?.message ?? "").startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (String(e?.message ?? "").startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}