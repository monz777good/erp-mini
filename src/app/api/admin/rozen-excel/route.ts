// src/app/api/admin/rozen-excel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const onlyNumber = (v: string) => String(v ?? "").replace(/[^\d]/g, "");

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const where: any = { status: "APPROVED" };

    // ()       
    if (fromStr || toStr) {
      where.createdAt = {};
      if (fromStr) where.createdAt.gte = new Date(`${fromStr}T00:00:00.000Z`);
      if (toStr) where.createdAt.lt = new Date(`${toStr}T23:59:59.999Z`);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { user: true, item: true },
      orderBy: { createdAt: "asc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("");

    //     /      
    //   addRow /    .
    //     :
    ws.addRow([
      "y",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    for (const o of orders) {
      ws.addRow([
        "y",
        (o as any).receiverName ?? "",
        (o as any).receiverAddr ?? "",
        onlyNumber((o as any).receiverTel ?? ""),
        onlyNumber((o as any).receiverPhone ?? ""),
        1,
        3850,
        "",
        o.item?.name ?? "",
        (o as any).note ?? "",
      ]);
    }

    const buf = await wb.xlsx.writeBuffer();

    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rozen.xlsx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}