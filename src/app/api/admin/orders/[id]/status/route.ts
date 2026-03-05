import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Next.js 15/16 params Promise 대응
type Ctx = { params: Promise<{ id: string }> };

function s(v: any) {
  return String(v ?? "").trim();
}

export async function POST(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const next = s(body?.status).toUpperCase();

    const allow = new Set(["REQUESTED", "APPROVED", "REJECTED", "DONE"]);
    if (!allow.has(next)) {
      return NextResponse.json({ ok: false, message: "status 값이 올바르지 않습니다." }, { status: 400 });
    }

    // ✅ groupId 없음: id 1건만 변경
    const updated = await prisma.order.update({
      where: { id },
      data: { status: next as OrderStatus },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, message: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}