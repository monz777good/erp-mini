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

// ✅ KST(한국시간) 날짜 문자열(YYYY-MM-DD)을 Date로 변환
function kstStartOfDay(ymd: string) {
  // 00:00:00 KST
  return new Date(`${ymd}T00:00:00+09:00`);
}
function kstEndOfDay(ymd: string) {
  // 23:59:59.999 KST
  return new Date(`${ymd}T23:59:59.999+09:00`);
}

function asOrderStatus(v: string | null): OrderStatus | null {
  const s = String(v ?? "").toUpperCase().trim();
  if (s === "REQUESTED") return OrderStatus.REQUESTED;
  if (s === "APPROVED") return OrderStatus.APPROVED;
  if (s === "REJECTED") return OrderStatus.REJECTED;
  if (s === "DONE") return OrderStatus.DONE;
  return null;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 로그인이 필요합니다.", 401);

  const { searchParams } = new URL(req.url);

  const status = asOrderStatus(searchParams.get("status"));
  const q = String(searchParams.get("q") ?? "").trim();
  const from = String(searchParams.get("from") ?? "").trim(); // YYYY-MM-DD
  const to = String(searchParams.get("to") ?? "").trim(); // YYYY-MM-DD

  const where: any = {};
  if (status) where.status = status;

  // ✅ 한국시간 날짜범위 필터
  if (from && to) {
    where.createdAt = {
      gte: kstStartOfDay(from),
      lte: kstEndOfDay(to),
    };
  } else if (from) {
    where.createdAt = { gte: kstStartOfDay(from) };
  } else if (to) {
    where.createdAt = { lte: kstEndOfDay(to) };
  }

  // ✅ 검색 (품목명/수화인/거래처/요양기관번호/영업사원/전화/핸드폰)
  if (q) {
    where.OR = [
      { receiverName: { contains: q, mode: "insensitive" } },
      { receiverAddr: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { mobile: { contains: q } },
      { note: { contains: q, mode: "insensitive" } },
      { item: { name: { contains: q, mode: "insensitive" } } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { client: { careInstitutionNo: { contains: q } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      client: { select: { id: true, name: true, careInstitutionNo: true } },
      item: { select: { id: true, name: true } },
    },
    take: 500,
  });

  // ✅ 프론트가 쓰기 쉬운 형태로 정리
  const rows = orders.map((o) => ({
    id: o.id,
    status: o.status,
    quantity: o.quantity,
    createdAt: o.createdAt.toISOString(),

    itemName: o.item?.name ?? "",
    salesName: o.user?.name ?? "",
    salesPhone: o.user?.phone ?? "",

    receiverName: o.receiverName,
    receiverAddr: o.receiverAddr,
    phone: o.phone ?? "",
    mobile: o.mobile ?? "",

    clientName: o.client?.name ?? "",
    careInstitutionNo: o.client?.careInstitutionNo ?? "",

    note: o.note ?? "",
  }));

  return NextResponse.json({ ok: true, rows });
}