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

    // 로젠 헤더
    ws.addRow([
      "y", // A1
      "", // B1
      "수하인주소", // C1
      "수하인전화번호", // D1
      "수하인핸드폰번호", // E1
      "박스수량", // F1
      "운임요금", // G1
      "운임구분", // H1
      "품목명", // I1
      "", // J1
      "배송메세지", // K1
    ]);

    for (const o of orders) {
      ws.addRow([
        (o as any).receiverName ?? "", // A 수하인
        "", // B 공백
        (o as any).receiverAddr ?? "", // C 주소
        onlyNumber((o as any).receiverTel ?? ""), // D 전화
        onlyNumber((o as any).receiverPhone ?? ""), // E 핸드폰
        1, // F 박스수량
        3850, // G 운임
        "", // H 운임구분
        o.item?.name ?? "", // I 품목
        "", // J 공백
        (o as any).note ?? "", // K 배송메세지
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