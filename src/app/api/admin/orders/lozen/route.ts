import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";

const SHIPPING_FEE = 3850;
const DEFAULT_BOX = 1;
const DEFAULT_FREIGHT_TYPE = "";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function GET(req: NextRequest) {
  try {
    //  : req   
    requireAdmin();

    const orders = await prisma.order.findMany({
      where: { status: OrderStatus.APPROVED },
      orderBy: { createdAt: "asc" },
      include: {
        item: { select: { name: true } },
      },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("rozen");

    ws.getCell("A1").value = "Y";
    ws.getCell("B1").value = "";
    ws.getCell("C1").value = "";
    ws.getCell("D1").value = "";
    ws.getCell("E1").value = "";
    ws.getCell("F1").value = "";
    ws.getCell("G1").value = "";
    ws.getCell("H1").value = "";
    ws.getCell("I1").value = "";
    ws.getCell("J1").value = "";
    ws.getCell("K1").value = "";

    let r = 2;

    for (const o of orders as any[]) {
      const tel = digitsOnly(o.receiverTel);
      const mobile = digitsOnly(o.receiverMobile ?? o.receiverTel);

      ws.getCell(`A${r}`).value = "y";
      ws.getCell(`B${r}`).value = o.receiverName ?? "";
      ws.getCell(`C${r}`).value = o.receiverAddr ?? "";
      ws.getCell(`D${r}`).value = tel;
      ws.getCell(`E${r}`).value = mobile;
      ws.getCell(`F${r}`).value = Number(o.boxCount ?? DEFAULT_BOX);
      ws.getCell(`G${r}`).value = Number(o.deliveryFee ?? SHIPPING_FEE);
      ws.getCell(`H${r}`).value = o.freightType ?? DEFAULT_FREIGHT_TYPE;
      ws.getCell(`I${r}`).value = o.item?.name ?? "";
      ws.getCell(`K${r}`).value = o.deliveryMsg ?? o.note ?? "";

      r++;
    }

    const buf = await wb.xlsx.writeBuffer();

    return new NextResponse(buf as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rozen.xlsx"`,
      },
    });
  } catch (e: any) {
    if (String(e?.message ?? "").startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (String(e?.message ?? "").startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}