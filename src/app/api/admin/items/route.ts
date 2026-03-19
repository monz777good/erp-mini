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

function n(v: any) {
  const num = Number(v ?? 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

function isFkConstraintError(e: any) {
  const code = String(e?.code ?? "");
  const msg = String(e?.message ?? "");
  return code === "P2003" || code === "P2014" || /Foreign key constraint/i.test(msg) || /constraint failed/i.test(msg);
}

export async function GET(_req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 권한이 필요합니다.", 401);

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      createdAt: true,
      bundleV: true,
      stockV: true,
      extraV: true,
    },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 권한이 필요합니다.", 401);

  const body = await req.json().catch(() => ({}));
  const name = s(body?.name);
  const price = n(body?.price);

  if (!name) return err("품목명이 필요합니다.");

  try {
    const created = await prisma.item.create({
      data: { name, price },
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
        bundleV: true,
        stockV: true,
        extraV: true,
      },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return err(e?.message ?? "품목 추가 중 오류가 발생했습니다.", 400);
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 권한이 필요합니다.", 401);

  const body = await req.json().catch(() => ({}));
  const id = s(body?.id);
  const name = s(body?.name);
  const price = n(body?.price);

  if (!id) return err("id가 필요합니다.");
  if (!name) return err("품목명이 필요합니다.");

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { name, price },
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
        bundleV: true,
        stockV: true,
        extraV: true,
      },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return err(e?.message ?? "품목 수정 중 오류가 발생했습니다.", 400);
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 권한이 필요합니다.", 401);

  const { searchParams } = new URL(req.url);
  const id = s(searchParams.get("id"));

  if (!id) return err("id가 필요합니다.");

  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (isFkConstraintError(e)) {
      return err("이미 주문에 사용된 품목이라 삭제할 수 없습니다. (이름 수정으로 처리하세요)", 409);
    }
    return err(e?.message ?? "품목 삭제 중 오류가 발생했습니다.", 400);
  }
}