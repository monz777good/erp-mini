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

  // ✅ 1) 승인(APPROVED) 주문만 로젠 출력 대상으로 조회
  const orders = await prisma.order.findMany({
    where: {
      status: "APPROVED",
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: "asc" },
    include: {
      client: true,
      item: { select: { id: true, name: true } },
      user: { select: { name: true, phone: true } },
    },
    take: 5000,
  });

  if (orders.length === 0) {
    return NextResponse.json({ ok: false, message: "출력할 승인 주문이 없습니다." }, { status: 400 });
  }

  // ✅ 2) 엑셀 생성 (다운로드)
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

  // ✅ 3) 여기부터가 핵심:
  //    로젠 출력 성공 시 → (A) 해당 주문들 DONE 처리
  //                    → (B) 품목별 수량 합산해서 Item.bundleV 차감
  //
  // ⚠️ 재고 차감은 "묶음 수량" 기준이라고 했으니 bundleV만 차감.
  //     (원하면 stockV도 같이 차감하는 옵션을 붙일 수 있음)

  // 품목별 총 수량 합산
  const qtyByItem = new Map<string, number>();
  const orderIds: string[] = [];

  for (const o of orders as any[]) {
    orderIds.push(o.id);
    const itemId = o.itemId || o.item?.id;
    if (!itemId) continue;
    const q = Math.max(1, Number(o.quantity ?? 1) || 1);
    qtyByItem.set(itemId, (qtyByItem.get(itemId) ?? 0) + q);
  }

  // 트랜잭션: (1) 주문 DONE (2) 재고 차감
  await prisma.$transaction(async (tx) => {
    // 1) 주문 상태 DONE
    await tx.order.updateMany({
      where: { id: { in: orderIds }, status: "APPROVED" },
      data: { status: "DONE" },
    });

    // 2) 재고 차감 (bundleV)
    const itemIds = Array.from(qtyByItem.keys());
    const items = await tx.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, bundleV: true },
    });

    const currentMap = new Map(items.map((it) => [it.id, it.bundleV ?? 0]));

    for (const [itemId, dec] of qtyByItem.entries()) {
      const cur = currentMap.get(itemId) ?? 0;
      const next = Math.max(0, cur - dec); // ✅ 음수 방지
      await tx.item.update({
        where: { id: itemId },
        data: { bundleV: next },
      });
    }
  });

  // ✅ 4) 엑셀 응답 반환
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