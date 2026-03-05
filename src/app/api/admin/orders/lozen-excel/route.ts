import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// KST(한국시간) 날짜 문자열(YYYY-MM-DD)을 UTC Date 범위로 변환
function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

function s(v: any) {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const fromYmd = s(body?.from);
  const toYmd = s(body?.to);
  const status = s(body?.status || "APPROVED").toUpperCase();
  const q = s(body?.q);

  if (!fromYmd || !toYmd) {
    return NextResponse.json({ ok: false, message: "from/to(기간)이 필요합니다." }, { status: 400 });
  }

  const { from, to } = kstRange(fromYmd, toYmd);

  const where: any = {
    createdAt: { gte: from, lte: to },
  };

  if (status === "APPROVED") where.status = OrderStatus.APPROVED;
  else if (status === "REQUESTED") where.status = OrderStatus.REQUESTED;
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
      item: { select: { id: true, name: true, bundleV: true } },
    },
  });

  if (!orders.length) {
    return NextResponse.json({ ok: false, message: "출력할 주문이 없습니다." }, { status: 400 });
  }

  // ✅ 엑셀 생성 (네 양식 그대로)
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("lozen");

  // 1행(헤더)
  ws.getCell("A1").value = "y";            // A1 = y
  ws.getCell("B1").value = "";             // B 공백
  ws.getCell("C1").value = "수하인주소";   // C1 헤더(주소)
  ws.getCell("D1").value = "전화번호";     // D
  ws.getCell("E1").value = "핸드폰번호";   // E
  ws.getCell("F1").value = "박스수량";     // F
  ws.getCell("G1").value = "택배운임";     // G
  ws.getCell("H1").value = "운임구분";     // H(공백 고정이지만 헤더는 표시)
  ws.getCell("I1").value = "품목명";       // I
  ws.getCell("J1").value = "";             // J 공백
  ws.getCell("K1").value = "배송메세지";   // K

  // 2행부터 데이터
  orders.forEach((o, idx) => {
    const r = 2 + idx;

    ws.getCell(`A${r}`).value = s(o.receiverName); // 수하인명
    ws.getCell(`B${r}`).value = "";                // 공백
    ws.getCell(`C${r}`).value = s(o.receiverAddr); // 주소
    ws.getCell(`D${r}`).value = s(o.phone);        // 전화
    ws.getCell(`E${r}`).value = s(o.mobile);       // 핸드폰
    ws.getCell(`F${r}`).value = 1;                 // 박스수량 고정
    ws.getCell(`G${r}`).value = 3850;              // 운임 고정
    ws.getCell(`H${r}`).value = "";                // 운임구분 공백 고정
    ws.getCell(`I${r}`).value = s(o.item?.name);   // 품목명
    ws.getCell(`J${r}`).value = "";                // 공백
    ws.getCell(`K${r}`).value = s(o.note);         // 배송메세지
  });

  // 폭(보기용)
  ws.columns = [
    { width: 18 }, // A
    { width: 3 },  // B
    { width: 40 }, // C
    { width: 16 }, // D
    { width: 16 }, // E
    { width: 10 }, // F
    { width: 10 }, // G
    { width: 10 }, // H
    { width: 22 }, // I
    { width: 3 },  // J
    { width: 30 }, // K
  ];

  // ✅ 로젠 출력하면: DONE 처리 + 재고 차감
  const ids = orders.map((o) => o.id);

  // item별 차감량 합산: bundleV * quantity
  const decByItem: Record<string, number> = {};
  for (const o of orders) {
    const itemId = o.item?.id;
    if (!itemId) continue;
    const bundle = Number(o.item.bundleV ?? 0) > 0 ? Number(o.item.bundleV) : 1;
    const qty = Number(o.quantity ?? 0) > 0 ? Number(o.quantity) : 0;
    const dec = bundle * qty;
    if (dec <= 0) continue;
    decByItem[itemId] = (decByItem[itemId] ?? 0) + dec;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { id: { in: ids } },
      data: { status: OrderStatus.DONE },
    });

    for (const [itemId, dec] of Object.entries(decByItem)) {
      await tx.item.update({
        where: { id: itemId },
        data: { stockV: { decrement: dec } },
      });
    }
  });

  const buf = await wb.xlsx.writeBuffer();
  const fileName = `lozen_${fromYmd}_to_${toYmd}.xlsx`;

  return new NextResponse(buf as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}