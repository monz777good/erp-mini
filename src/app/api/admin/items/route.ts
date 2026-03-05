// src/app/api/admin/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function isPrismaUniqueError(e: any) {
  // Prisma known error: P2002 = Unique constraint failed
  return e?.code === "P2002" || String(e?.message ?? "").includes("Unique constraint failed");
}

// ✅ 품목 목록
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, items });
}

// ✅ 품목 추가
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();

  if (!name) return err("품목명을 입력해주세요.");

  try {
    const created = await prisma.item.create({
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    if (isPrismaUniqueError(e)) {
      return err("이미 등록된 품목입니다.", 409);
    }
    return err("품목 추가 중 오류가 발생했습니다.", 400);
  }
}

// ✅ 품목명 수정 (id 기준)
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  const name = String(body?.name ?? "").trim();

  if (!id) return err("id가 필요합니다.");
  if (!name) return err("품목명을 입력해주세요.");

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    if (isPrismaUniqueError(e)) {
      return err("이미 등록된 품목명입니다.", 409);
    }
    return err("품목 수정 중 오류가 발생했습니다.", 400);
  }
}

// ✅ 품목 삭제 (id 기준)
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") ?? "").trim();
  if (!id) return err("id가 필요합니다.");

  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return err("품목 삭제 중 오류가 발생했습니다.", 400);
  }
}