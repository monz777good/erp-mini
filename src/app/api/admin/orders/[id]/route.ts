import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser(req);
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const next = body?.status;

  const allowed = new Set(["REQUESTED", "APPROVED", "REJECTED", "DONE"]);
  if (!next || !allowed.has(next)) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id },
    data: { status: next },
  });

  return NextResponse.json({ ok: true });
}
