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
  try {
    // ✅ 관리자 아니면 여기서 throw 됨
    requireAdmin(req);

    const { searchParams } = new URL(req.url);

    const from = toDateOrNull(searchParams.get("from"));
    const to = toDateOrNull(searchParams.get("to"));
    const statuses = toOrderStatuses(searchParams.get("statuses"));

    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) {
        const toExclusive = new Date(to);
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

    if (statuses) where.status = { in: statuses };

    const orders = await prisma.order.findMany({
      where,
      include: { user: true, item: true },
      orderBy: { createdAt: "asc" },
    });

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
    // ✅ 권한 에러는 401로
    if (String(e?.message ?? "").startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (String(e?.message ?? "").startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "EXPORT_FAILED" },
      { status: 500 }
    );
  }
}