// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function asOrderStatus(v: any): OrderStatus | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "DONE") return OrderStatus.DONE;
  return null;
}

// ✅ "YYYY-MM-DD"를 KST 기준 시작/끝 Date로 변환
function kstRange(from?: string | null, to?: string | null) {
  const f = (from ?? "").trim();
  const t = (to ?? "").trim();

  // 둘 다 없으면 range 없음
  if (!f && !t) return null;

  // from만 있으면 그날 00:00 KST
  const fromDate = f ? new Date(`${f}T00:00:00+09:00`) : null;

  // to만 있으면 그날 23:59:59.999 KST
  const toDate = t ? new Date(`${t}T23:59:59.999+09:00`) : null;

  // 안전장치 (Invalid Date)
  const gte = fromDate && !isNaN(fromDate.getTime()) ? fromDate : null;
  const lte = toDate && !isNaN(toDate.getTime()) ? toDate : null;

  if (!gte && !lte) return null;

  // Prisma는 lte도 가능하지만, millisecond 끝값을 쓰면 안정적
  return { gte, lte };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);

  const statusParam = searchParams.get("status");
  const q = (searchParams.get("q") ?? "").trim();
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");     // YYYY-MM-DD

  const status = statusParam ? asOrderStatus(statusParam) : null;
  if (statusParam && !status) return err("status 값이 올바르지 않습니다.", 400);

  const range = kstRange(from, to);

  const where: any = {};
  if (status) where.status = status;

  if (range) {
    where.createdAt = {};
    if (range.gte) where.createdAt.gte = range.gte;
    if (range.lte) where.createdAt.lte = range.lte;
  }

  if (q) {
    where.OR = [
      { item: { name: { contains: q, mode: "insensitive" } } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { client: { careInstitutionNo: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q, mode: "insensitive" } } },
      { receiverName: { contains: q, mode: "insensitive" } },
      { receiverAddr: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q, mode: "insensitive" } },
      { note: { contains: q, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      quantity: true,
      createdAt: true,
      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      note: true,
      user: { select: { name: true, phone: true } },
      client: { select: { name: true, careInstitutionNo: true } },
      item: { select: { name: true } },
    },
  });

  // ✅ 기존 프론트 호환 위해 object로 반환
  return NextResponse.json({ ok: true, orders });
}