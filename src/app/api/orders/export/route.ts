import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: NextRequest) {
  //   : requireAdmin() .   .
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    //     ,  
    const where: any = {};
    if (from || to) {
      const gte = from ? new Date(`${from}T00:00:00.000Z`) : undefined;
      const lte = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
      where.createdAt = {};
      if (gte) where.createdAt.gte = gte;
      if (lte) where.createdAt.lte = lte;
    }

    //        any 
    const orders = (await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })) as any[];

    //  
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("orders");

    ws.columns = [
      { header: "id", key: "id", width: 26 },
      { header: "createdAt", key: "createdAt", width: 14 },
      { header: "status", key: "status", width: 12 },
      { header: "receiverName", key: "receiverName", width: 18 },
      { header: "receiverAddr", key: "receiverAddr", width: 40 },
      { header: "phone", key: "phone", width: 16 },
      { header: "mobile", key: "mobile", width: 16 },
      { header: "quantity", key: "quantity", width: 10 },
      { header: "note", key: "note", width: 30 },
    ];

    for (const o of orders) {
      ws.addRow({
        id: String(o?.id ?? ""),
        createdAt: o?.createdAt ? toYmd(new Date(o.createdAt)) : "",
        status: String(o?.status ?? ""),
        receiverName: String(o?.receiverName ?? ""),
        receiverAddr: String(o?.receiverAddr ?? ""),
        phone: String(o?.phone ?? ""),
        mobile: String(o?.mobile ?? ""),
        quantity: Number(o?.quantity ?? 0),
        note: String(o?.note ?? ""),
      });
    }

    const buf = await wb.xlsx.writeBuffer();

    const filename =
      from || to ? `orders_${from ?? "ALL"}_${to ?? "ALL"}.xlsx` : `orders_all.xlsx`;

    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "EXPORT_FAILED" },
      { status: 500 }
    );
  }
}