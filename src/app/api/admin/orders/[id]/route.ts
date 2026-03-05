// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: any) {
  return String(v ?? "").trim();
}

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

// ✅ Next 16.1.x 타입 생성 이슈 대응:
// context.params 가 Promise로 잡히는 경우가 있어 any로 받고 안전하게 처리
async function getIdFromContext(context: any) {
  const p = context?.params;
  const params = typeof p?.then === "function" ? await p : p;
  return s(params?.id);
}

export async function PATCH(req: NextRequest, context: any) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const id = await getIdFromContext(context);
  if (!id) return err("ID_REQUIRED");

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("BAD_REQUEST");
  }

  const status = s(body.status) as OrderStatus;
  if (!["APPROVED", "REJECTED", "DONE", "REQUESTED"].includes(status)) {
    return err("INVALID_STATUS");
  }

  // ✅ 기준 주문 1건 조회
  const base = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      userId: true,
      clientId: true,
      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      note: true,
    },
  });

  if (!base) return err("NOT_FOUND", 404);

  // ✅ groupId 없이도 “같은 주문요청 묶음” 업데이트
  await prisma.order.updateMany({
    where: {
      createdAt: base.createdAt,
      userId: base.userId,
      clientId: base.clientId,
      receiverName: base.receiverName,
      receiverAddr: base.receiverAddr,
      phone: base.phone,
      mobile: base.mobile,
      note: base.note,
    },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}