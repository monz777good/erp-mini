import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function GET() {
  const orders = await prisma.order.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    include: { item: true },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("로젠");

  // ✅ A1 = y
  ws.getCell("A1").value = "y";

  // ✅ 헤더는 1행
  ws.getCell("B1").value = "수하인주소";
  ws.getCell("D1").value = "수하인전화번호";
  ws.getCell("E1").value = "수하인핸드폰번호";
  ws.getCell("F1").value = "박스수량";
  ws.getCell("G1").value = "택배운임";
  ws.getCell("H1").value = "운임구분";
  ws.getCell("I1").value = "품목명";

  // ✅ 데이터는 2행부터
  let r = 2;
  for (const o of orders) {
    const phone = digitsOnly(
      (o as any).receiverPhone ?? (o as any).phone ?? ""
    );
    const mobile = digitsOnly(
      (o as any).receiverMobile ?? (o as any).mobile ?? (o as any).phone ?? ""
    );

    ws.getCell(`A${r}`).value = (o as any).receiverName ?? "";        // 수하인명
    ws.getCell(`B${r}`).value = (o as any).receiverAddr ?? "";        // 주소
    ws.getCell(`D${r}`).value = phone;                                // ✅ 전화(숫자만)
    ws.getCell(`E${r}`).value = mobile;                               // ✅ 핸드폰(숫자만)
    ws.getCell(`F${r}`).value = Number((o as any).boxQty ?? 1) || 1;  // 박스
    ws.getCell(`G${r}`).value = Number((o as any).shippingFee ?? 3850) || 3850; // 운임
    ws.getCell(`H${r}`).value = (o as any).feeType ?? "선불";          // 운임구분
    ws.getCell(`I${r}`).value = o.item?.name ?? "";                   // 품목명
    r++;
  }

  // 보기 좋게 폭
  ws.getColumn("A").width = 18;
  ws.getColumn("B").width = 45;
  ws.getColumn("D").width = 18;
  ws.getColumn("E").width = 18;
  ws.getColumn("F").width = 10;
  ws.getColumn("G").width = 10;
  ws.getColumn("H").width = 10;
  ws.getColumn("I").width = 30;

  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(buf as any, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="lozen.xlsx"',
    },
  });
}