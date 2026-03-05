// src/app/api/admin/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

//   
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("  .", 401);

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, items });
}

//   
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("  .", 401);

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();

  if (!name) return err(" .");

  try {
    const created = await prisma.item.create({
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    // unique  
    return err(e?.message ?? "  ", 400);
  }
}

//    (id )
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("  .", 401);

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  const name = String(body?.name ?? "").trim();

  if (!id) return err("id .");
  if (!name) return err(" .");

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return err(e?.message ?? "  ", 400);
  }
}

//    (id )
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("  .", 401);

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") ?? "").trim();
  if (!id) return err("id .");

  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return err(e?.message ?? "  ", 400);
  }
}