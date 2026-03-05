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
  const ws = wb.addWorksheet("");

  //  A1 = y
  ws.getCell("A1").value = "y";

  //   1
  ws.getCell("B1").value = "";
  ws.getCell("D1").value = "";
  ws.getCell("E1").value = "";
  ws.getCell("F1").value = "";
  ws.getCell("G1").value = "";
  ws.getCell("H1").value = "";
  ws.getCell("I1").value = "";

  //   2
  let r = 2;
  for (const o of orders) {
    const phone = digitsOnly(
      (o as any).receiverPhone ?? (o as any).phone ?? ""
    );
    const mobile = digitsOnly(
      (o as any).receiverMobile ?? (o as any).mobile ?? (o as any).phone ?? ""
    );

    ws.getCell(`A${r}`).value = (o as any).receiverName ?? "";        // 
    ws.getCell(`B${r}`).value = (o as any).receiverAddr ?? "";        // 
    ws.getCell(`D${r}`).value = phone;                                //  ()
    ws.getCell(`E${r}`).value = mobile;                               //  ()
    ws.getCell(`F${r}`).value = Number((o as any).boxQty ?? 1) || 1;  // 
    ws.getCell(`G${r}`).value = Number((o as any).shippingFee ?? 3850) || 3850; // 
    ws.getCell(`H${r}`).value = (o as any).feeType ?? "";          // 
    ws.getCell(`I${r}`).value = o.item?.name ?? "";                   // 
    r++;
  }

  //   
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