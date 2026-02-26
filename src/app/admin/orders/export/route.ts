import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";

function toDateOrNull(v: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// ✅ string -> OrderStatus 로 안전 변환 (틀린 값은 제거)
function toOrderStatuses(v: string | null): OrderStatus[] | null {
  if (!v) return null;
  const raw = v
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const allowed = new Set(Object.values(OrderStatus));
  const parsed = raw.filter((x): x is OrderStatus => allowed.has(x as OrderStatus));
  return parsed.length ? parsed : null;
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    
  try {
    const { searchParams } = new URL(req.url);

    // 예) ?from=2026-02-01&to=2026-02-28
    const from = toDateOrNull(searchParams.get("from"));
    const to = toDateOrNull(searchParams.get("to"));

    // ✅ 예) ?statuses=APPROVED,DONE  (없으면 전체)
    const statuses = toOrderStatuses(searchParams.get("statuses"));

    // 날짜 범위가 있으면 [from, to) 형태로 안전하게 처리
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) {
        const toExclusive = new Date(to);
        // 날짜만 넣을 때 당일 포함되게 만들고 싶으면 다음날 00:00으로
        // (시간까지 넣으면 그대로 사용됨)
        if (
          toExclusive.getHours() === 0 &&
          toExclusive.getMinutes() === 0 &&
          toExclusive.getSeconds() === 0 &&
          toExclusive.getMilliseconds() === 0
        ) {
          toExclusive.setDate(toExclusive.getDate() + 1);
        }
        where.createdAt.lt = toExclusive;
      }
    }

    if (statuses) {
      // ✅ 여기서 타입이 OrderStatus[]라서 빌드 에러 안 남
      where.status = { in: statuses };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        item: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // =========================
    // Excel 생성
    // =========================
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("orders");

    ws.columns = [
      { header: "날짜", key: "createdAt", width: 20 },
      { header: "영업사원", key: "sales", width: 14 },
      { header: "상태", key: "status", width: 12 },
      { header: "품목", key: "item", width: 24 },
      { header: "수량", key: "qty", width: 8 },

      { header: "수하인명", key: "receiverName", width: 14 },
      { header: "주소", key: "receiverAddr", width: 40 },
      { header: "전화", key: "receiverPhone", width: 16 },
      { header: "핸드폰", key: "receiverMobile", width: 16 },
      { header: "박스수량", key: "boxQty", width: 10 },
      { header: "택배운임", key: "shipFee", width: 10 },
      { header: "배송메세지", key: "message", width: 20 },
      { header: "비고", key: "note", width: 24 },
    ];

    for (const o of orders) {
      ws.addRow({
        createdAt: new Date(o.createdAt).toLocaleString("ko-KR"),
        sales: o.user?.name ?? "",
        status: o.status,
        item: o.item?.name ?? "",
        qty: o.quantity ?? "",

        receiverName: (o as any).receiverName ?? "",
        receiverAddr: (o as any).receiverAddr ?? "",
        receiverPhone: (o as any).receiverPhone ?? "",
        receiverMobile: (o as any).receiverMobile ?? "",
        boxQty: (o as any).boxQty ?? "",
        shipFee: (o as any).shipFee ?? "",
        message: (o as any).message ?? "",
        note: o.note ?? "",
      });
    }

    // 헤더 고정 느낌
    ws.getRow(1).font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    const fileName = `orders_${Date.now()}.xlsx`;

    return new NextResponse(buf as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
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