console.log("🔥🔥🔥 ROZEN API 실행됨");
// src/app/api/admin/rozen-excel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const onlyNumber = (v: string) => String(v ?? "").replace(/[^\d]/g, "");
const s = (v: any) => String(v ?? "").trim();

// ✅ 같은 주문(여러 품목)을 한 건으로 묶기 위한 키
function makeGroupKey(o: any) {
  return [
    s(o.userId),
    s(o.clientId),
    s(o.receiverName),
    s(o.receiverAddr),
    onlyNumber(s(o.phone)),
    onlyNumber(s(o.mobile)),
    s(o.note),
    o.createdAt ? new Date(o.createdAt).toISOString() : "",
  ].join("||");
}

// ✅ 품목 여러 개를 한 칸으로 합치기
function mergeItemNames(rows: any[]) {
  const counts = new Map<string, number>();

  for (const r of rows) {
    const itemName = s(r?.item?.name);
    if (!itemName) continue;
    counts.set(itemName, (counts.get(itemName) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, qty]) => (qty > 1 ? `${name} x${qty}` : name))
    .join(", ");
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const where: any = { status: "APPROVED" };

    // 날짜 필터
    if (fromStr || toStr) {
      where.createdAt = {};
      if (fromStr) where.createdAt.gte = new Date(`${fromStr}T00:00:00.000Z`);
      if (toStr) where.createdAt.lte = new Date(`${toStr}T23:59:59.999Z`);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        item: true,
        client: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // ✅ 같은 주문 묶기
    const groupedMap = new Map<string, any[]>();

    for (const o of orders) {
      const key = makeGroupKey(o);
      const arr = groupedMap.get(key) ?? [];
      arr.push(o);
      groupedMap.set(key, arr);
    }

    const groupedOrders = Array.from(groupedMap.values()).map((rows) => {
      const first = rows[0];

      return {
        receiverName: s(first.receiverName),
        receiverAddr: s(first.receiverAddr),
        phone: onlyNumber(s(first.phone)),
        mobile: onlyNumber(s(first.mobile)),
        note: s(first.note),
        itemText: mergeItemNames(rows),
      };
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("");

    // ✅ 1행 헤더
    ws.addRow([
      "Y",             // A1
      "",              // B1
      "수하인주소",       // C1
      "수하인전화번호",   // D1
      "수하인핸드폰번호", // E1
      "박스수량",         // F1
      "택배운임",         // G1
      "운임구분",         // H1
      "품목명",           // I1
      "",              // J1
      "배송메세지",       // K1
    ]);

    // ✅ 2행부터 데이터
    for (const o of groupedOrders) {
      ws.addRow([
        o.receiverName, // A: 수하인
        "",             // B: 공백
        o.receiverAddr, // C: 수하인주소
        o.phone,        // D: 수하인전화번호
        o.mobile,       // E: 수하인핸드폰번호
        1,              // F: 박스수량 고정
        3850,           // G: 택배운임 고정
        "",             // H: 운임구분 공백
        o.itemText,     // I: 품목명(합쳐짐)
        "",             // J: 공백
        o.note,         // K: 배송메세지
      ]);
    }

    // 보기 편한 열 너비
    ws.columns = [
      { width: 18 }, // A
      { width: 8 },  // B
      { width: 38 }, // C
      { width: 18 }, // D
      { width: 18 }, // E
      { width: 10 }, // F
      { width: 12 }, // G
      { width: 10 }, // H
      { width: 42 }, // I
      { width: 8 },  // J
      { width: 28 }, // K
    ];

    const buf = await wb.xlsx.writeBuffer();

    const fromLabel = fromStr || "all";
    const toLabel = toStr || "all";

    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rozen_${fromLabel}_${toLabel}.xlsx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}