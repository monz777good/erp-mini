// src/app/api/admin/orders/[id]/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function s(v: any) {
  return String(v ?? "").trim();
}

export async function POST(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const status = s(body.status).toUpperCase();

    if (!status) {
      return NextResponse.json({ ok: false, message: "status 필요" }, { status: 400 });
    }

    // ✅ 검증
    const next =
      status === "REQUESTED"
        ? OrderStatus.REQUESTED
        : status === "APPROVED"
        ? OrderStatus.APPROVED
        : status === "REJECTED"
        ? OrderStatus.REJECTED
        : status === "DONE"
        ? OrderStatus.DONE
        : null;

    if (!next) {
      return NextResponse.json({ ok: false, message: "status 값이 올바르지 않습니다." }, { status: 400 });
    }

    // ✅ 핵심: id가 (1) 실제 주문 id 일 수도 있고 (2) groupId 일 수도 있음
    const updated = await prisma.order.updateMany({
      where: {
        OR: [{ id }, { groupId: id }],
      },
      data: { status: next },
    });

    if (!updated.count) {
      return NextResponse.json({ ok: false, message: "대상 주문을 찾지 못했습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, count: updated.count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "상태변경 실패" }, { status: 500 });
  }
}