import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

const ALLOWED = new Set(["REQUESTED", "APPROVED", "REJECTED", "DONE"]);

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const p = await ctx.params; // ✅ Promise든 object든 OK
  const id = p?.id;

  if (!id) {
    return NextResponse.json({ ok: false, message: "id 필요" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const status = String(body?.status ?? "").toUpperCase().trim();

  if (!ALLOWED.has(status)) {
    return NextResponse.json(
      { ok: false, message: "status는 REQUESTED/APPROVED/REJECTED/DONE만" },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: status as any },
  });

  return NextResponse.json({ ok: true, order });
}