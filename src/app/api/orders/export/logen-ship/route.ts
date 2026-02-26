import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";

const onlyNumber = (v: string) => String(v ?? "").replace(/[^\d]/g, "");

export async function GET() {
  try {
    // ✅ 안전장치: 승인된 주문만 로젠 출력 + 출고완료 처리
    const orders = await prisma.order.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("로젠업로드");

    ws.addRow([
      "수하인명",
      "수하인주소",
      "수하인전화번호",
      "수하인핸드폰",
      "박스수량",
      "요금",
      "운임구분",
      "품목명",
      "배송메시지",
    ]);

    for (const o of orders) {
      const name = (o.user as any)?.name ?? "";
      const address = (o.user as any)?.address ?? "";
      const phone = (o.user as any)?.phone ?? "";

      ws.addRow([
        name,
        address,
        phone ? onlyNumber(phone) : "",
        phone ? onlyNumber(phone) : "",
        1,
        3850,
        "",
        (o as any).itemName ?? (o as any).name ?? "",
        (o as any).memo ?? (o as any).deliveryMemo ?? "",
      ]);
    }

    // ✅ 보기 좋게: 헤더 굵게 + 자동 열너비
    ws.getRow(1).font = { bold: true };
    ws.columns.forEach((col) => {
      let max = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > max) max = len;
      });
      col.width = Math.min(40, max + 2);
    });

    // ✅ 여기서 출고완료로 변경 (승인된 주문만!)
    if (orders.length > 0) {
      await prisma.order.updateMany({
        where: { status: "APPROVED" },
        data: { status: "SHIPPED" },
      });
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="logen_${Date.now()}.xlsx"`,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "export failed" }, { status: 500 });
  }
}
