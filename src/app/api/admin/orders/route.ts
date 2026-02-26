import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// ✅ 관리자 체크
function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

// ✅ GET: 관리자 주문 조회(필요하면 기존 그대로 쓰면 됨)
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "REQUESTED";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = (searchParams.get("q") || "").trim();

  const where: any = { status };

  if (from && to) {
    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T23:59:59");
    where.createdAt = { gte: start, lte: end };
  }

  if (q) {
    where.OR = [
      { receiverName: { contains: q } },
      { receiverAddr: { contains: q } },
      { phone: { contains: q } },
      { mobile: { contains: q } },
      { note: { contains: q } },
      { message: { contains: q } },
      { client: { name: { contains: q } } },
      { item: { name: { contains: q } } },
      { user: { name: { contains: q } } },
      { user: { phone: { contains: q } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      item: true,
      user: true,
      client: true,
    },
  });

  return NextResponse.json({ orders });
}

// ✅ PATCH: 승인/거절 상태 변경 (이게 없어서 405 난 거야)
export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const id = String(body?.id ?? body?.orderId ?? "").trim();
  const status = String(body?.status ?? "").trim().toUpperCase();

  if (!id) {
    return NextResponse.json({ message: "id required" }, { status: 400 });
  }
  if (!["APPROVED", "REJECTED", "DONE", "REQUESTED"].includes(status)) {
    return NextResponse.json({ message: "invalid status" }, { status: 400 });
  }

  // ✅ 상태 업데이트
  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ ok: true, order: updated });
}