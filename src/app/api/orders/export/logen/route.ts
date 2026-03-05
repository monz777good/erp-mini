// src/app/api/orders/export/logen/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const runtime = "nodejs"; //  / Node  

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function GET() {
  //      (    status  )
  const orders = await prisma.order.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      item: true,
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("");

  //       (A=Y, B=, C=, D=, E=, F=, G=/, H=, I=, J(), K=)
  // 1   "y"    ,   .
  //        .

  //  A1 y  ,      
  // (  "A1 Y, A2 "  )
  ws.getCell("A1").value = "y";

  let rowIndex = 2; // A2 

  for (const o of orders) {
    const receiverName = (o as any).receiverName ?? "";
    const receiverAddr =
      (o as any).receiverAddr ?? (o as any).address ?? ""; //   address   ( ). receiverAddr .
    const tel = digitsOnly((o as any).receiverPhone ?? (o as any).phone ?? "");
    const mobile = digitsOnly(
      (o as any).receiverMobile ?? (o as any).mobile ?? (o as any).phone ?? ""
    );

    const boxQty = (o as any).boxQty ?? (o as any).quantity ?? 1; //  DB boxQty  quantity 
    const shipFee = 3850; // ()

    const fareType = (o as any).fareType ?? ""; // ( )
    const itemName = o.item?.name ?? "";
    const msg = (o as any).deliveryMsg ?? (o as any).note ?? ""; // ( note)

    // A~K (J )
    ws.getCell(`A${rowIndex}`).value = "y"; // A
    ws.getCell(`B${rowIndex}`).value = receiverName; // B 
    ws.getCell(`C${rowIndex}`).value = receiverAddr; // C 
    ws.getCell(`D${rowIndex}`).value = tel; // D 
    ws.getCell(`E${rowIndex}`).value = mobile; // E 
    ws.getCell(`F${rowIndex}`).value = Number(boxQty) || 1; // F 
    ws.getCell(`G${rowIndex}`).value = shipFee; // G /
    ws.getCell(`H${rowIndex}`).value = fareType; // H 
    ws.getCell(`I${rowIndex}`).value = itemName; // I 
    // J 
    ws.getCell(`K${rowIndex}`).value = msg; // K 

    rowIndex++;
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="logen.xlsx"`,
    },
  });
}