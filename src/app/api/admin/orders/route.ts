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

// ✅ KST(한국시간) 기준 날짜 문자열(YYYY-MM-DD)을 UTC Date 범위로 변환
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

function s(v: any) {
  return String(v ?? "").trim();
}

// ✅ 관리자 주문 목록
// - "장바구니 주문"을 1건으로 묶어서 내려줌
// - 관리자 화면이 기대하는 형태(itemName / quantityText / groupKey 등)로 내려줌
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 로그인이 필요합니다.", 401);

  const url = new URL(req.url);
  const fromYmd = s(url.searchParams.get("from"));
  const toYmd = s(url.searchParams.get("to"));
  const status = s(url.searchParams.get("status") || "REQUESTED").toUpperCase();
  const q = s(url.searchParams.get("q"));

  const where: any = {};
  if (fromYmd && toYmd) {
    const { from, to } = kstRange(fromYmd, toYmd);
    where.createdAt = { gte: from, lte: to };
  }

  if (status === "REQUESTED") where.status = OrderStatus.REQUESTED;
  else if (status === "APPROVED") where.status = OrderStatus.APPROVED;
  else if (status === "REJECTED") where.status = OrderStatus.REJECTED;
  else if (status === "DONE") where.status = OrderStatus.DONE;

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
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      client: { select: { id: true, name: true, careInstitutionNo: true } },
      item: { select: { id: true, name: true } },
    },
  });

  // ✅ "장바구니 주문" 묶기
  // - 같은 영업사원/거래처/수하인정보/상태
  // - createdAt 2초 버킷
  type G = {
    groupKey: string;
    ids: string[]; // 그룹에 포함된 주문 id들 (상태변경 시 한 번에 변경용)
    status: OrderStatus;
    createdAt: Date;

    salesName: string;
    salesPhone: string;

    receiverName: string;
    receiverAddr: string;
    phone: string;
    mobile: string;
    note: string;

    clientName: string;
    instNo: string;

    // 품목별 합산
    items: { name: string; quantity: number }[];
  };

  const m = new Map<string, G>();

  for (const o of orders) {
    const bucket = Math.floor(new Date(o.createdAt).getTime() / 2000);
    const key = [
      o.userId,
      o.clientId,
      o.status,
      bucket,
      s(o.receiverName),
      s(o.receiverAddr),
      s(o.phone),
      s(o.mobile),
      s(o.note),
    ].join("|");

    const itemName = s(o.item?.name);
    const qty = Number(o.quantity ?? 0) || 0;

    const exist = m.get(key);
    if (!exist) {
      m.set(key, {
        groupKey: key,
        ids: [o.id],
        status: o.status,
        createdAt: o.createdAt,

        salesName: s(o.user?.name),
        salesPhone: s(o.user?.phone),

        receiverName: s(o.receiverName),
        receiverAddr: s(o.receiverAddr),
        phone: s(o.phone),
        mobile: s(o.mobile),
        note: s(o.note),

        clientName: s(o.client?.name),
        instNo: s(o.client?.careInstitutionNo),

        items: itemName ? [{ name: itemName, quantity: qty }] : [],
      });
    } else {
      exist.ids.push(o.id);

      const found = exist.items.find((x) => x.name === itemName);
      if (found) found.quantity += qty;
      else if (itemName) exist.items.push({ name: itemName, quantity: qty });

      if (o.createdAt < exist.createdAt) exist.createdAt = o.createdAt;
    }
  }

  // ✅ 관리자 화면이 기대하는 필드로 변환
  // - itemName: 줄바꿈으로 품목 전부
  // - quantityText: 줄바꿈으로 수량 전부
  const rows = Array.from(m.values())
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((g) => {
      const itemName = g.items.map((it) => `${it.name}`).join("\n");
      const quantityText = g.items.map((it) => `x${it.quantity}`).join("\n");

      return {
        // ✅ 대표 id(그룹 첫 주문 id) + groupKey + ids
        id: g.ids[0],
        ids: g.ids,
        groupKey: g.groupKey,

        status: g.status,
        createdAt: g.createdAt,

        salesName: g.salesName,
        salesPhone: g.salesPhone,

        receiverName: g.receiverName,
        receiverAddr: g.receiverAddr,
        phone: g.phone,
        mobile: g.mobile,
        note: g.note,

        clientName: g.clientName,
        instNo: g.instNo,

        // ✅ 관리자 UI용(줄바꿈 표시)
        itemName,
        quantityText,
      };
    });

  return NextResponse.json({ ok: true, rows });
}

// ✅ 상태 변경
// - 프론트가 groupKey/ids를 보내주면 그룹 전체 변경
// - 아니면 id 1건만 변경 (하위호환)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return err("관리자 로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => ({}));
  const id = s(body?.id);
  const ids = Array.isArray(body?.ids) ? body.ids.map((x: any) => s(x)).filter(Boolean) : [];
  const status = s(body?.status).toUpperCase();

  if (!status) return err("status가 필요합니다.");

  const allow = new Set(["REQUESTED", "APPROVED", "REJECTED", "DONE"]);
  if (!allow.has(status)) return err("status 값이 올바르지 않습니다.");

  // ✅ 그룹 ids가 오면 한 번에 변경
  if (ids.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { status: status as any },
    });
    return NextResponse.json({ ok: true });
  }

  // ✅ 하위호환: id 1건만 변경
  if (!id) return err("id가 필요합니다.");

  const updated = await prisma.order.update({
    where: { id },
    data: { status: status as any },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, order: updated });
}
