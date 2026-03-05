// src/app/api/admin/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function s(v: any) {
  return String(v ?? "").trim();
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return err("UNAUTHORIZED", 401);

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("UNAUTHORIZED", 401);

  const body = await req.json().catch(() => ({}));
  const name = s(body?.name);

  if (!name) return err("품목명을 입력하세요.");

  try {
    const created = await prisma.item.create({
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return err(e?.message ?? "추가 실패", 400);
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("UNAUTHORIZED", 401);

  const body = await req.json().catch(() => ({}));
  const id = s(body?.id);
  const name = s(body?.name);

  if (!id) return err("id 필요");
  if (!name) return err("품목명 필요");

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return err(e?.message ?? "수정 실패", 400);
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("UNAUTHORIZED", 401);

  const { searchParams } = new URL(req.url);
  const id = s(searchParams.get("id"));
  if (!id) return err("id 필요");

  // ✅ 주문에 연결된 품목이면 삭제 금지
  const used = await prisma.order.count({ where: { itemId: id } });
  if (used > 0) {
    return err(`이 품목은 이미 주문(${used}건)에 사용되어 삭제할 수 없습니다.`, 400);
  }

  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return err(e?.message ?? "삭제 실패", 400);
  }
}