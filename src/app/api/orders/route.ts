// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function s(v: any) {
  return String(v ?? "").trim();
}

// ✅ KST(한국시간) 기준 날짜 문자열(YYYY-MM-DD)을 UTC Date 범위로 변환
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const { searchParams } = new URL(req.url);

  const fromYmd = s(searchParams.get("from")) || "";
  const toYmd = s(searchParams.get("to")) || "";
  const q = s(searchParams.get("q")) || "";

  if (!fromYmd || !toYmd) return err("DATE_REQUIRED", 400);

  const { from, to } = kstRange(fromYmd, toYmd);

  // ✅ SALES는 본인 주문만, ADMIN은 전체
  const where: any = {
    createdAt: { gte: from, lte: to },
    ...(me.role === "ADMIN" ? {} : { userId: me.id }),
  };

  // ✅ 검색(거래처/수하인/주소/전화/비고/품목명)
  if (q) {
    where.OR = [
      { receiverName: { contains: q, mode: "insensitive" } },
      { receiverAddr: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q, mode: "insensitive" } },
      { note: { contains: q, mode: "insensitive" } },
      // 거래처명(관계가 있으면)
      { client: { is: { name: { contains: q, mode: "insensitive" } } } },
      // ✅ 품목명
      { item: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,

      quantity: true, // ✅ 수량 내려줌

      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      note: true,

      // 거래처명(있으면)
      client: { select: { name: true } },

      // ✅ 품목명 내려줌 (items ❌, item ✅)
      item: { select: { name: true } },
    },
  });

  // ✅ 프론트가 바로 쓰기 쉽게 평탄화해서 내려줌
  const orders = rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    quantity: r.quantity ?? 0,

    clientName: r.client?.name ?? null,
    itemName: r.item?.name ?? null,

    receiverName: r.receiverName ?? null,
    receiverAddr: r.receiverAddr ?? null,
    phone: r.phone ?? null,
    mobile: r.mobile ?? null,
    note: r.note ?? null,
  }));

  return NextResponse.json({ ok: true, orders });
}