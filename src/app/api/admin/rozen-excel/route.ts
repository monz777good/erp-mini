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
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const where: any = { status: "APPROVED" };

    // (옵션) 기간 필터가 원래 있던 경우 그대로 유지
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
    const ws = wb.addWorksheet("로젠업로드");

    // ⚠️ 여기 아래 “로젠 헤더/컬럼”은 네가 이미 확정한 양식이 있을 테니
    // 기존 파일의 addRow 헤더/데이터 로우를 그대로 쓰면 됨.
    // 우선은 빌드부터 살리는 최소 예시:
    ws.addRow([
      "y",
      "수하인명",
      "수하인주소",
      "수하인전화번호",
      "수하인핸드폰번호",
      "박스수량",
      "택배운임",
      "운임구분",
      "품목명",
      "배송메세지",
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