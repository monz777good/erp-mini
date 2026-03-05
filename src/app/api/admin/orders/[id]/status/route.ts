import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

const ALLOWED = new Set(["REQUESTED", "APPROVED", "REJECTED", "DONE"]);

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    //    (req )
    requireAdmin();

    const p = await ctx.params; // Promise object OK
    const id = p?.id;

    if (!id) {
      return NextResponse.json({ ok: false, message: "id " }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = String((body as any)?.status ?? "").toUpperCase().trim();

    if (!ALLOWED.has(status)) {
      return NextResponse.json(
        { ok: false, message: "status REQUESTED/APPROVED/REJECTED/DONE" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
    });

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