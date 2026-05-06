// src/app/api/admin/lozen/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: any) {
  return String(v ?? "").trim();
}

function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const fromYmd = s(url.searchParams.get("from"));
  const toYmd = s(url.searchParams.get("to"));

  if (!fromYmd || !toYmd) {
    return NextResponse.json(
      { ok: false, message: "from/to required" },
      { status: 400 }
    );
  }

  const { from, to } = kstRange(fromYmd, toYmd);

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.APPROVED,
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: "asc" },
    include: {
      client: true,
      item: { select: { id: true, name: true, bundleV: true, stockV: true } },
      user: { select: { name: true, phone: true } },
    },
    take: 5000,
  });

  if (orders.length === 0) {
    return NextResponse.json(
      { ok: false, message: "출력할 승인 주문이 없습니다." },
      { status: 400 }
    );
  }

  const grouped = new Map<
    string,
    {
      first: any;
      items: Map<string, { name: string; qty: number }>;
      orderIds: string[];
    }
  >();

  for (const o of orders as any[]) {
    const key = makeGroupKey(o);

    if (!grouped.has(key)) {
      grouped.set(key, {
        first: o,
        items: new Map(),
        orderIds: [],
      });
    }

    const g = grouped.get(key)!;
    g.orderIds.push(o.id);

    const itemId = s(o.itemId || o.item?.id || "");
    const itemName = s(o.item?.name || o.itemName || "-") || "-";
    const qty = Math.max(1, Number(o.quantity ?? 1) || 1);
    const itemKey = itemId || itemName;

    const prev = g.items.get(itemKey);
    if (prev) {
      prev.qty += qty;
    } else {
      g.items.set(itemKey, { name: itemName, qty });
    }
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("lozen");

  // ✅ 로젠 양식 헤더
  ws.getCell("A1").value = "y";
  ws.getCell("B1").value = "";
  ws.getCell("C1").value = "수하인주소";
  ws.getCell("D1").value = "전화번호";
  ws.getCell("E1").value = "핸드폰번호";
  ws.getCell("F1").value = "박스수량";
  ws.getCell("G1").value = "택배운임";
  ws.getCell("H1").value = "운임구분";
  ws.getCell("I1").value = "품목명";
  ws.getCell("J1").value = "";
  ws.getCell("K1").value = "배송메세지";

  ws.getRow(1).font = { bold: true };

  let rowNo = 2;

  for (const g of grouped.values()) {
    const o = g.first;

    const itemText = Array.from(g.items.values())
      .map((it) => `${it.name} x${it.qty}`)
      .join(" / ");

    ws.getCell(`A${rowNo}`).value = s(o.receiverName);
    ws.getCell(`B${rowNo}`).value = "";
    ws.getCell(`C${rowNo}`).value = s(o.receiverAddr);
    ws.getCell(`D${rowNo}`).value = s(o.phone);
    ws.getCell(`E${rowNo}`).value = s(o.mobile);
    ws.getCell(`F${rowNo}`).value = 1;
    ws.getCell(`G${rowNo}`).value = 3850;
    ws.getCell(`H${rowNo}`).value = "";
    ws.getCell(`I${rowNo}`).value = itemText;
    ws.getCell(`J${rowNo}`).value = "";
    ws.getCell(`K${rowNo}`).value = s(o.note);

    ws.getCell(`A${rowNo}`).numFmt = "@";
    ws.getCell(`C${rowNo}`).numFmt = "@";
    ws.getCell(`D${rowNo}`).numFmt = "@";
    ws.getCell(`E${rowNo}`).numFmt = "@";
    ws.getCell(`I${rowNo}`).numFmt = "@";
    ws.getCell(`K${rowNo}`).numFmt = "@";

    rowNo++;
  }

  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 3;
  ws.getColumn(3).width = 42;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 16;
  ws.getColumn(6).width = 10;
  ws.getColumn(7).width = 10;
  ws.getColumn(8).width = 10;
  ws.getColumn(9).width = 34;
  ws.getColumn(10).width = 3;
  ws.getColumn(11).width = 34;

  // ✅ 기존 기능 유지: 로젠 출력 후 DONE 처리 + 재고 차감
  const orderIds = orders.map((o: any) => o.id);
  const qtyByItem = new Map<string, number>();

  for (const o of orders as any[]) {
    const itemId = o.itemId || o.item?.id;
    if (!itemId) continue;

    const q = Math.max(1, Number(o.quantity ?? 1) || 1);
    qtyByItem.set(itemId, (qtyByItem.get(itemId) ?? 0) + q);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { id: { in: orderIds }, status: OrderStatus.APPROVED },
      data: { status: OrderStatus.DONE },
    });

    const itemIds = Array.from(qtyByItem.keys());

    const items = await tx.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, bundleV: true, stockV: true },
    });

    const itemMap = new Map(items.map((it) => [it.id, it]));

    for (const [itemId, orderQty] of qtyByItem.entries()) {
      const it = itemMap.get(itemId);
      if (!it) continue;

      const bundleV = Math.max(0, Number(it.bundleV ?? 0) || 0);
      const stockV = Math.max(0, Number(it.stockV ?? 0) || 0);
      const decV = orderQty * bundleV;
      const nextStock = Math.max(0, stockV - decV);

      await tx.item.update({
        where: { id: itemId },
        data: { stockV: nextStock },
      });
    }
  });

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="lozen_${fromYmd}_${toYmd}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}