// src/app/api/admin/lozen/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: any) {
  return String(v ?? "").trim();
}

// ✅ KST 기준 날짜 범위
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const fromYmd = s(url.searchParams.get("from"));
  const toYmd = s(url.searchParams.get("to"));

  if (!fromYmd || !toYmd) {
    return NextResponse.json({ ok: false, message: "from/to required" }, { status: 400 });
  }

  const { from, to } = kstRange(fromYmd, toYmd);

  // ✅ 승인(APPROVED) 주문만 로젠 출력 대상으로 조회
  const orders = await prisma.order.findMany({
    where: {
      status: "APPROVED",
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: "asc" },
    include: {
      client: true,
      item: { select: { id: true, name: true, bundleV: true, stockV: true } }, // ✅ bundleV/stockV 필요
      user: { select: { name: true, phone: true } },
    },
    take: 5000,
  });

  if (orders.length === 0) {
    return NextResponse.json({ ok: false, message: "출력할 승인 주문이 없습니다." }, { status: 400 });
  }

  // ✅ 1) 엑셀 생성
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("lozen");

  ws.columns = [
    { header: "등록일", key: "createdAt", width: 20 },
    { header: "거래처", key: "clientName", width: 18 },
    { header: "수하인", key: "receiverName", width: 14 },
    { header: "주소", key: "receiverAddr", width: 40 },
    { header: "전화", key: "phone", width: 14 },
    { header: "핸드폰", key: "mobile", width: 14 },
    { header: "품목", key: "itemName", width: 22 },
    { header: "수량", key: "qty", width: 8 },
    { header: "영업사원", key: "salesName", width: 12 },
    { header: "영업전화", key: "salesPhone", width: 14 },
    { header: "비고", key: "note", width: 22 },
  ];

  for (const o of orders as any[]) {
    ws.addRow({
      createdAt: o.createdAt?.toISOString?.() ?? "",
      clientName: o.client?.name ?? "",
      receiverName: o.receiverName ?? "",
      receiverAddr: o.receiverAddr ?? "",
      phone: o.phone ?? "",
      mobile: o.mobile ?? "",
      itemName: o.item?.name ?? "",
      qty: Number(o.quantity ?? 1) || 1,
      salesName: o.user?.name ?? "",
      salesPhone: o.user?.phone ?? "",
      note: o.note ?? "",
    });
  }
  ws.getRow(1).font = { bold: true };

  // ✅ 2) 로젠 출력 성공 시 처리:
  //    - 주문: APPROVED -> DONE
  //    - 재고: stockV 차감 (주문수량 × bundleV)
  const orderIds: string[] = [];
  const qtyByItem = new Map<string, number>();

  for (const o of orders as any[]) {
    orderIds.push(o.id);
    const itemId = o.itemId || o.item?.id;
    if (!itemId) continue;

    const q = Math.max(1, Number(o.quantity ?? 1) || 1);
    qtyByItem.set(itemId, (qtyByItem.get(itemId) ?? 0) + q);
  }

  await prisma.$transaction(async (tx) => {
    // (A) 주문 DONE 처리
    await tx.order.updateMany({
      where: { id: { in: orderIds }, status: "APPROVED" },
      data: { status: "DONE" },
    });

    // (B) 재고 차감: stockV에서 (수량 * bundleV) 차감
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

      // ✅ 핵심: "상품 1개 주문 시 차감될 V" * 주문수량
      const decV = orderQty * bundleV;

      const nextStock = Math.max(0, stockV - decV);

      await tx.item.update({
        where: { id: itemId },
        data: { stockV: nextStock },
      });
    }
  });

  // ✅ 3) 엑셀 응답 반환
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