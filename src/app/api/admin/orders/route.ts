// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: any) {
  return String(v ?? "").trim();
}

// KST(한국시간) YYYY-MM-DD -> Date range(+09:00)
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(req.url);
  const status = s(url.searchParams.get("status") || "REQUESTED").toUpperCase();
  const fromYmd = s(url.searchParams.get("from"));
  const toYmd = s(url.searchParams.get("to"));
  const q = s(url.searchParams.get("q"));

  const where: any = {};

  if (fromYmd && toYmd) {
    const { from, to } = kstRange(fromYmd, toYmd);
    where.createdAt = { gte: from, lte: to };
  }

  if (status === "REQUESTED") where.status = OrderStatus.REQUESTED;
  if (status === "APPROVED") where.status = OrderStatus.APPROVED;
  if (status === "REJECTED") where.status = OrderStatus.REJECTED;
  if (status === "DONE") where.status = OrderStatus.DONE;

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

  // ✅ 원본 row들
  const list = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      item: { select: { name: true } },
      user: { select: { name: true, phone: true } },
      client: { select: { name: true, careInstitutionNo: true } },
    },
  });

  // ✅ groupId(없으면 id)로 묶기
  type Agg = {
    key: string; // groupId 또는 단품 id
    status: OrderStatus;
    createdAt: Date;
    receiverName: string;
    receiverAddr: string;
    phone: string | null;
    mobile: string | null;
    note: string | null;
    salesName: string;
    salesPhone: string;
    clientName: string;
    careInstitutionNo: string | null;
    totalQty: number;
    itemLines: Record<string, number>; // itemName -> qty합
  };

  const map = new Map<string, Agg>();

  for (const o of list) {
    const key = o.groupId || o.id;

    const cur =
      map.get(key) ||
      ({
        key,
        status: o.status,
        createdAt: o.createdAt,
        receiverName: o.receiverName,
        receiverAddr: o.receiverAddr,
        phone: o.phone,
        mobile: o.mobile,
        note: o.note,
        salesName: o.user?.name || "-",
        salesPhone: o.user?.phone || "-",
        clientName: o.client?.name || "-",
        careInstitutionNo: o.client?.careInstitutionNo || null,
        totalQty: 0,
        itemLines: {},
      } as Agg);

    // status/createdAt은 가장 빠른걸로 통일
    if (o.createdAt < cur.createdAt) cur.createdAt = o.createdAt;
    cur.status = o.status;

    cur.totalQty += Number(o.quantity ?? 0);

    const nm = o.item?.name || "-";
    cur.itemLines[nm] = (cur.itemLines[nm] ?? 0) + Number(o.quantity ?? 0);

    map.set(key, cur);
  }

  const rows = Array.from(map.values())
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((g) => {
      const itemName = Object.entries(g.itemLines)
        .map(([nm, qty]) => `${nm} x${qty}`)
        .join(", ");

      return {
        id: g.key, // ✅ 여기 id가 “groupId(장바구니)” 또는 “단품 id”
        status: g.status,
        quantity: g.totalQty,
        createdAt: g.createdAt.toISOString(),

        itemName,
        salesName: g.salesName,
        salesPhone: g.salesPhone,

        receiverName: g.receiverName,
        receiverAddr: g.receiverAddr,
        phone: g.phone || "",
        mobile: g.mobile || "",

        clientName: g.clientName,
        careInstitutionNo: g.careInstitutionNo || "",

        note: g.note || "",
      };
    });

  return NextResponse.json({ ok: true, rows });
}