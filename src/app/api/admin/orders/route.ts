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

type GroupRow = {
  id: string; // 대표 주문 id
  createdAt: string;
  status: string;

  userName: string;
  userPhone: string;

  receiverName: string;
  receiverAddr: string;
  phone?: string | null;
  mobile?: string | null;

  clientName: string;
  clientId: string;

  // (있으면 보여주고, 없으면 "-" 처리) → Prisma에 없는 필드 select 절대 금지
  hospitalNo?: string | null;

  note?: string | null;

  items: ItemLine[];
  orderIds: string[];

  // ✅ 구버전 호환 (테이블이 이걸 쓰는 경우 대비)
  itemName: string; // 줄바꿈 문자열
  quantity: string; // "x1\nx3" 줄바꿈 문자열
};

function makeGroupKey(o: any) {
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
      client: true, // ✅ 안전: Client 모델 전체 include (없는 필드 select로 500 나는 것 방지)
      item: { select: { id: true, name: true } },
    },
    take: 3000,
  });

  const map = new Map<string, GroupRow>();

  for (const o of orders as any[]) {
    const key = makeGroupKey(o);

    if (!map.has(key)) {
      const clientAny = o.client as any;

      map.set(key, {
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        status: o.status,

        userName: o.user?.name ?? "",
        userPhone: o.user?.phone ?? "",

        receiverName: o.receiverName ?? "",
        receiverAddr: o.receiverAddr ?? "",
        phone: o.phone ?? null,
        mobile: o.mobile ?? null,

        clientName: clientAny?.name ?? "",
        clientId: clientAny?.id ?? "",

        // ✅ 있으면 담고 없으면 null (필드 없다고 500 나지 않음)
        hospitalNo: clientAny?.hospitalNo ?? null,

        note: o.note ?? null,

        items: [],
        orderIds: [],

        itemName: "",
        quantity: "",
      });
    }

    const g = map.get(key)!;
    g.orderIds.push(o.id);

    const itemId = s(o.itemId || o.item?.id || o.item_id);
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

  // ✅ 구버전 호환 문자열 생성
  for (const g of map.values()) {
    g.itemName = g.items.map((it) => it.itemName).join("\n");
    g.quantity = g.items.map((it) => `x${it.quantity}`).join("\n");
  }

  const rows = Array.from(map.values());
  return NextResponse.json({ ok: true, rows });
}