import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function kstDate(date: Date) {
  const d = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()} 년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

function clean(v: any) {
  return String(v ?? "").trim();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const { id } = await params;

    const baseOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        item: true,
        client: true,
        user: true,
      },
    });

    if (!baseOrder) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const specYN = String(
      (baseOrder as any).specYN ??
        (baseOrder as any).statementYn ??
        (baseOrder as any).statementY ??
        (baseOrder as any).statementRequest ??
        (baseOrder as any).specificationYn ??
        ""
    )
      .trim()
      .toUpperCase();

    if (specYN !== "Y") {
      return NextResponse.json(
        { ok: false, error: "Y만 출력 가능", currentValue: specYN || "-" },
        { status: 400 }
      );
    }

    /*
      관리자 주문 목록은 같은 createdAt / userId / clientId / 수하인 / 주소 / 연락처 / 비고 / specYN 기준으로
      여러 품목을 한 주문처럼 묶어서 보여줌.
      명세서도 같은 기준으로 다시 찾아서 여러 품목을 출력함.
    */
    const groupedOrders = await prisma.order.findMany({
      where: {
        createdAt: baseOrder.createdAt,
        userId: (baseOrder as any).userId,
        clientId: (baseOrder as any).clientId,
        receiverName: (baseOrder as any).receiverName,
        receiverAddr: (baseOrder as any).receiverAddr,
        phone: (baseOrder as any).phone,
        mobile: (baseOrder as any).mobile,
        note: (baseOrder as any).note,
        specYN: (baseOrder as any).specYN,
        status: (baseOrder as any).status,
      },
      include: {
        item: true,
        client: true,
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const orders = groupedOrders.length > 0 ? groupedOrders : [baseOrder];

    const filePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "trade_statement.xlsx"
    );

    const buffer = await fs.readFile(filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];

    const clientName = clean(baseOrder.client?.name);
    sheet.getCell("C6").value = kstDate(baseOrder.createdAt);
    sheet.getCell("C9").value = `${clientName} 귀하`;

    // 기존 템플릿 샘플 품목 삭제
    for (let row = 17; row <= 27; row++) {
      sheet.getCell(`B${row}`).value = row - 16;
      sheet.getCell(`C${row}`).value = "";
      sheet.getCell(`D${row}`).value = "";
      sheet.getCell(`E${row}`).value = "";
      sheet.getCell(`F${row}`).value = "";
      sheet.getCell(`G${row}`).value = "";
    }

    const itemMap = new Map<
      string,
      { name: string; qty: number; price: number }
    >();

    for (const o of orders as any[]) {
      const itemId = clean(o.itemId || o.item?.id || "");
      const itemName = clean(o.item?.name || o.itemName || "-") || "-";
      const qty = Math.max(1, Number(o.quantity ?? o.qty ?? 1) || 1);
      const price = Math.max(0, Number(o.item?.price ?? 0) || 0);

      const key = itemId || itemName;

      if (itemMap.has(key)) {
        const prev = itemMap.get(key)!;
        prev.qty += qty;
        if (!prev.price && price) prev.price = price;
      } else {
        itemMap.set(key, { name: itemName, qty, price });
      }
    }

    const lines = Array.from(itemMap.values()).slice(0, 11);

    let total = 0;

    lines.forEach((line, index) => {
      const row = 17 + index;
      const amount = line.qty * line.price;
      total += amount;

      sheet.getCell(`B${row}`).value = index + 1;
      sheet.getCell(`C${row}`).value = line.name;
      sheet.getCell(`D${row}`).value = line.qty;
      sheet.getCell(`E${row}`).value = line.price;
      sheet.getCell(`F${row}`).value = amount;

      sheet.getCell(`E${row}`).numFmt = "#,##0";
      sheet.getCell(`F${row}`).numFmt = "#,##0";
    });

    // 상단 합계금액 / 하단 합계
    sheet.getCell("G15").value = total;
    sheet.getCell("F28").value = total;

    sheet.getCell("G15").numFmt = "#,##0";
    sheet.getCell("F28").numFmt = "#,##0";

    const out = await workbook.xlsx.writeBuffer();

    const fileName = `${clientName || "거래처"}_거래명세서.xlsx`;

    return new NextResponse(out, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (e: any) {
    console.error("TRADE_STATEMENT_ERROR", e);

    return NextResponse.json(
      { ok: false, error: e?.message || "거래명세서 출력 실패" },
      { status: 500 }
    );
  }
}