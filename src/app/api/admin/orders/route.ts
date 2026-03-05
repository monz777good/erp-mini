import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";

function asOrderStatus(v: any): OrderStatus | null {
  const s = String(v ?? "").toUpperCase();
  if (s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "DONE") return OrderStatus.DONE;
  return null;
}

//  GET:   
export async function GET(req: NextRequest) {
  try {
    requireAdmin();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.trim() || "";
    const status = asOrderStatus(statusParam);

    const where: any = {};
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true } },
        item: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, bizRegNo: true } },
      },
    });

    return NextResponse.json({ ok: true, orders });
  } catch (e: any) {
    if (String(e?.message ?? "").startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (String(e?.message ?? "").startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

//  PATCH:  
export async function PATCH(req: NextRequest) {
  try {
    requireAdmin();

    const body = await req.json().catch(() => ({}));
    const id = String((body as any)?.id ?? "");
    const next = asOrderStatus((body as any)?.status);

    if (!id) {
      return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    }
    if (!next) {
      return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: next },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    if (String(e?.message ?? "").startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (String(e?.message ?? "").startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}