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
function s(v: any) {
  return String(v ?? "").trim();
}

// ✅ KST(한국시간) 기준 날짜 문자열(YYYY-MM-DD)을 UTC Date 범위로 변환
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

type ItemLine = { itemId: string; itemName: string; quantity: number };

type RowOut = {
  id: string;
  createdAt: string;
  status: OrderStatus;

  // ✅ page.tsx가 쓰는 이름
  salesName: string;
  salesPhone: string;

  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;

  clientName: string;
  careInstitutionNo?: string | null;

  note?: string | null;

  // ✅ page.tsx가 줄바꿈으로 보여줄 값
  itemName: string;       // "품목A\n품목B"
  quantityText: string;   // "x1\nx3"

  // (참고용) 실제 합산 목록
  items: ItemLine[];
  orderIds: string[];
};

function makeGroupKey(o: any) {
  // ✅ 장바구니 묶음 그룹 키 (기존 groupId 없이도 안정적으로 묶음)
  return [
    o.createdAt?.toISOString?.() ?? String(o.createdAt),
    o.userId,
    o.clientId,
    s(o.receiverName),
    s(o.receiverAddr),
    s(o.phone),
    s(o.mobile),
    s(o.note),
  ].join("|");
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const from = s(url.searchParams.get("from"));
  const to = s(url.searchParams.get("to"));
  const status = s(url.searchParams.get("status"));
  const q = s(url.searchParams.get("q"));

  let createdAt: any = undefined;
  if (from && to) {
    const r = kstRange(from, to);
    createdAt = { gte: r.from, lte: r.to };
  }

  const where: any = {};
  if (createdAt) where.createdAt = createdAt;
  if (status) where.status = status as OrderStatus;

  if (q) {
    where.OR = [
      { receiverName: { contains: q, mode: "insensitive" } },
      { receiverAddr: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { mobile: { contains: q } },
      { note: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { item: { name: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      client: true, // ✅ 안전: Client 전체
      item: { select: { id: true, name: true } },
    },
    take: 3000,
  });

  const map = new Map<string, RowOut>();

  for (const o of orders as any[]) {
    const key = makeGroupKey(o);

    if (!map.has(key)) {
      const clientAny = o.client as any;
      const careNo =
        clientAny?.careInstitutionNo ??
        clientAny?.hospitalNo ??
        clientAny?.institutionNo ??
        null;

      map.set(key, {
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        status: o.status,

        salesName: o.user?.name ?? "",
        salesPhone: o.user?.phone ?? "",

        receiverName: o.receiverName ?? "",
        receiverAddr: o.receiverAddr ?? "",
        phone: o.phone ?? null,
        mobile: o.mobile ?? null,

        clientName: clientAny?.name ?? "",
        careInstitutionNo: careNo,

        note: o.note ?? null,

        itemName: "",
        quantityText: "",

        items: [],
        orderIds: [],
      });
    }

    const g = map.get(key)!;
    g.orderIds.push(o.id);

    const itemId = s(o.itemId || o.item?.id || "");
    const itemName = s(o.item?.name || o.itemName || o.item_name || "-") || "-";
    const qty = Math.max(1, Number(o.quantity ?? o.qty ?? 1) || 1);

    const found = g.items.find((it) => it.itemId === itemId && itemId);
    if (found) found.quantity += qty;
    else {
      g.items.push({
        itemId: itemId || `${itemName}_${g.items.length}`,
        itemName,
        quantity: qty,
      });
    }
  }

  // ✅ 줄바꿈 문자열 생성
  for (const g of map.values()) {
    g.itemName = g.items.map((it) => it.itemName).join("\n");
    g.quantityText = g.items.map((it) => `x${it.quantity}`).join("\n");
  }

  return NextResponse.json({ ok: true, rows: Array.from(map.values()) });
}