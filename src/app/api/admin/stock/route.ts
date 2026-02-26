import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "unauthorized" }, { status: 401 });

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, packV: true, stockV: true },
  });

  return NextResponse.json(items);
}

// ✅ 저장: packV는 "그대로 설정", stockV는 "추가재고(addV)만큼 누적 증가"
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "unauthorized" }, { status: 401 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "invalid body" }, { status: 400 });
  }

  const id = String(body?.id ?? "");
  const packV = Number(body?.packV ?? 1);
  const addV = Number(body?.addV ?? 0);

  if (!id) return NextResponse.json({ message: "id required" }, { status: 400 });
  if (!Number.isFinite(packV) || packV <= 0) {
    return NextResponse.json({ message: "packV must be > 0" }, { status: 400 });
  }
  if (!Number.isFinite(addV) || addV < 0) {
    return NextResponse.json({ message: "addV must be >= 0" }, { status: 400 });
  }

  // ✅ 원자적 증가(누적)
  const updated = await prisma.item.update({
    where: { id },
    data: {
      packV: Math.floor(packV),
      stockV: { increment: Math.floor(addV) },
    },
    select: { id: true, name: true, packV: true, stockV: true },
  });

  return NextResponse.json(updated);
}