// src/app/admin/orders/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function onlyNumber(v: string) {
  return String(v ?? "").replace(/[^\d]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    // ✅ 관리자 아니면 여기서 throw
    await requireAdmin(req);

    // ✅ 쿼리 파라미터 예: ?from=2026-03-01&to=2026-03-02
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.createdAt.lt = new Date(`${to}T23:59:59.999Z`);
    }

    // ✅ 필요한 데이터 조회 (너 DB 구조에 맞게 include 조정 가능)
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        item: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("주문내역");

    // ✅ 예시 헤더 (원하는 양식으로 바꿔도 됨)
    ws.addRow([
      "주문일시",
      "영업사원",
      "연락처",
      "품목",
      "수량",
      "상태",
      "수하인명",
      "수하인주소",
      "수하인전화",
      "수하인핸드폰",
      "메모",
    ]);

    for (const o of orders) {
      ws.addRow([
        o.createdAt ? new Date(o.createdAt).toISOString() : "",
        o.user?.name ?? "",
        onlyNumber(o.user?.phone ?? ""),
        o.item?.name ?? "",
        (o as any).quantity ?? "",
        String((o as any).status ?? ""),
        (o as any).receiverName ?? "",
        (o as any).receiverAddr ?? "",
        onlyNumber((o as any).receiverTel ?? ""),
        onlyNumber((o as any).receiverPhone ?? ""),
        (o as any).note ?? "",
      ]);
    }

    const buf = await wb.xlsx.writeBuffer();

    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="orders.xlsx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}