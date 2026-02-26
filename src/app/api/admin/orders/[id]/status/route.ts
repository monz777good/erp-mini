import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ ok: false }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = (body?.status ?? "").toUpperCase();

  const allowed = ["APPROVED", "REJECTED", "DONE"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ ok: false, error: "status가 잘못됨" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: status as any },
  });

  return NextResponse.json({ ok: true, order: updated });
}
