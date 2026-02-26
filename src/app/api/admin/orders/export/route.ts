import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

function toKSTDateStr(d: Date) {
  // KST 기준 YYYY-MM-DD
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return k.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to = url.searchParams.get("to");     // YYYY-MM-DD (inclusive)
  const statusParam = (url.searchParams.get("status") ?? "").toUpperCase().trim();

  const statuses: OrderStatus[] =
    statusParam === "APPROVED"
      ? [OrderStatus.APPROVED]
      : statusParam === "DONE"
      ? [OrderStatus.DONE]
      : statusParam === "REQUESTED"
      ? [OrderStatus.REQUESTED]
      : statusParam === "REJECTED"
      ? [OrderStatus.REJECTED]
      : [OrderStatus.APPROVED]; // 기본: 승인건

  const where: any = { status: { in: statuses } };

  if (from && to) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toExclusive = new Date(`${to}T00:00:00.000Z`);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    where.createdAt = { gte: fromDate, lt: toExclusive };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, phone: true } },
      item: { select: { name: true } },
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("orders");

  // 로젠 양식 (너가 말한 최신)
  // A: Y / B: 수하인명 / C: 수하인주소 / D: 전화 / E: 핸드폰 / F: 박스수량 / G: 택배운임 / H: 운임구분 / I: 품목 / J(비움) / K: 배송메세지
  ws.getCell("A1").value = "Y";
  ws.getCell("B1").value = "수하인명";
  ws.getCell("C1").value = "수하인주소";
  ws.getCell("D1").value = "전화";
  ws.getCell("E1").value = "핸드폰";
  ws.getCell("F1").value = "박스수량";
  ws.getCell("G1").value = "택배운임";
  ws.getCell("H1").value = "운임구분";
  ws.getCell("I1").value = "품목";
  ws.getCell("J1").value = "";
  ws.getCell("K1").value = "배송메세지";

  let row = 2;
  for (const o of orders as any[]) {
    // ✅ 여기서 mobile / phone을 “스키마에 있는 것만”으로 안전하게 처리
    // receiverPhone, receiverMobile 둘 중 존재하는 것만 사용 (없으면 user.phone fallback)
    const receiverPhone = digitsOnly(o.receiverPhone ?? o.phone ?? o.user?.phone);
    const receiverMobile = digitsOnly(o.receiverMobile ?? o.mobile ?? o.user?.phone);

    const receiverName = String(o.receiverName ?? "").trim();
    const receiverAddr = String(o.receiverAddr ?? "").trim();
    const boxCount = Number(o.boxCount ?? o.boxQty ?? 1);
    const fee = Number(o.deliveryFee ?? o.fee ?? 3850);
    const freightType = String(o.freightType ?? "선불");
    const itemName = String(o.item?.name ?? o.itemName ?? "");
    const msg = String(o.deliveryMsg ?? o.message ?? o.note ?? "");

    ws.getCell(`A${row}`).value = "y";
    ws.getCell(`B${row}`).value = receiverName;
    ws.getCell(`C${row}`).value = receiverAddr;
    ws.getCell(`D${row}`).value = receiverPhone;
    ws.getCell(`E${row}`).value = receiverMobile;
    ws.getCell(`F${row}`).value = boxCount;
    ws.getCell(`G${row}`).value = fee;
    ws.getCell(`H${row}`).value = freightType;
    ws.getCell(`I${row}`).value = itemName;
    ws.getCell(`K${row}`).value = msg;

    row++;
  }

  // 파일로 내려주기
  const buf = await wb.xlsx.writeBuffer();
  const fileName = `orders_${from ?? toKSTDateStr(new Date())}_${to ?? toKSTDateStr(new Date())}.xlsx`;

  return new NextResponse(buf as any, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}