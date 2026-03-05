import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(_req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return err("품목명이 필요합니다.");

  try {
    const created = await prisma.item.create({
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    // unique constraint 등
    return err(e?.message ?? "품목 추가 중 오류가 발생했습니다.", 400);
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  const name = String(body?.name ?? "").trim();

  if (!id) return err("id가 필요합니다.");
  if (!name) return err("품목명이 필요합니다.");

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return err(e?.message ?? "품목 수정 중 오류가 발생했습니다.", 400);
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") ?? "").trim();
  if (!id) return err("id가 필요합니다.");

  // 1) 존재 확인
  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!item) return err("해당 품목이 존재하지 않습니다.", 404);

  // 2) 주문에서 사용 여부 확인 (Restrict 때문에 여기서 막아야 함)
  const usedCount = await prisma.order.count({
    where: { itemId: id },
  });

  if (usedCount > 0) {
    return err(
      `이 품목은 이미 주문에 사용되어 삭제할 수 없습니다. (사용된 주문 ${usedCount}건)\n대신 품목명을 수정해서 구분하세요.`,
      409
    );
  }

  // 3) 실제 삭제
  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return err(e?.message ?? "품목 삭제 중 오류가 발생했습니다.", 400);
  }
}