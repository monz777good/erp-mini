import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ Next 16(Turbopack)에서 params 타입이 Promise로 잡히는 케이스까지 대응
 * - context.params 가 Promise일 수도, object일 수도 있음
 */
type Params = { id: string };
type Ctx = { params: Params | Promise<Params> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const p = await ctx.params; // ✅ Promise든 object든 둘 다 안전
  const id = p?.id;

  if (!id) {
    return NextResponse.json({ ok: false, message: "id 필요" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      item: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, phone: true, role: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ ok: false, message: "주문 없음" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}