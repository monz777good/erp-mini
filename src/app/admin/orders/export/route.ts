import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 날짜 필터: from(포함) ~ to(포함)
 * - from: 00:00:00 포함 (gte)
 * - to: 다음날 00:00:00 미만 (lt)
 */
function buildDateRange(fromStr: string, toStr: string) {
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T00:00:00`);
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);
  return { from, toExclusive };
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "관리자만" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const fromStr = String(searchParams.get("from") ?? "").trim();
  const toStr = String(searchParams.get("to") ?? "").trim();

  if (!fromStr || !toStr) {
    return NextResponse.json({ message: "from/to가 필요합니다. (YYYY-MM-DD)" }, { status: 400 });
  }

  const includeDone = String(searchParams.get("includeDone") ?? "0") === "1";

  const { from, toExclusive } = buildDateRange(fromStr, toStr);

  // ✅ 승인(APPROVED)만이 기본
  // 로젠 출력하면서 DONE으로 바뀌는 케이스까지 포함하고 싶으면 includeDone=1
  const statuses = includeDone ? ["APPROVED", "DONE"] : ["APPROVED"];

  const orders = await prisma.order.findMany({
    where: {
      status: { in: statuses },
      createdAt: { gte: from, lt: toExclusive },
    },
    orderBy: { createdAt: "asc" },
    include: {
      item: { select: { name: true } },
      user: { select: { name: true, phone: true } },
    },
  });

  // ======================
  // 엑셀 생성
  // ======================
  const wb = new ExcelJS.Workbook();

  // 1) 상세 시트
  const wsDetail = wb.addWorksheet("상세");
  wsDetail.addRow([`승인 주문 엑셀 (기간: ${fromStr} ~ ${toStr})`]);
  wsDetail.addRow([]);
  wsDetail.addRow([
    "주문일자",
    "품목",
    "수량",
    "수하인",
    "주소",
    "핸드폰",
    "전화",
    "요청메모",
    "요청자(영업)",
    "요청자폰",
    "상태",
  ]);

  for (const o of orders) {
    const d = new Date(o.createdAt);
    wsDetail.addRow([
      ymd(d), // 날짜만
      o.item?.name ?? "",
      o.quantity ?? 0,
      o.receiverName ?? "",
      o.receiverAddr ?? "",
      digitsOnly(o.mobile ?? ""),
      digitsOnly(o.phone ?? ""),
      o.message ?? "",
      o.user?.name ?? "",
      digitsOnly(o.user?.phone ?? ""),
      o.status ?? "",
    ]);
  }

  wsDetail.columns = [
    { width: 14 }, // 주문일자
    { width: 22 }, // 품목
    { width: 8 },  // 수량
    { width: 14 }, // 수하인
    { width: 38 }, // 주소
    { width: 16 }, // 핸드폰
    { width: 16 }, // 전화
    { width: 26 }, // 요청메모
    { width: 14 }, // 요청자
    { width: 16 }, // 요청자폰
    { width: 10 }, // 상태
  ];

  // 2) 날짜별 요약 시트
  const wsDaily = wb.addWorksheet("날짜별");
  wsDaily.addRow([`날짜별 요약 (기간: ${fromStr} ~ ${toStr})`]);
  wsDaily.addRow([]);
  wsDaily.addRow(["날짜", "주문건수", "총수량"]);

  const byDay = new Map<string, { count: number; qty: number }>();
  for (const o of orders) {
    const key = ymd(new Date(o.createdAt));
    const cur = byDay.get(key) ?? { count: 0, qty: 0 };
    cur.count += 1;
    cur.qty += Number(o.quantity ?? 0);
    byDay.set(key, cur);
  }

  const sortedDays = Array.from(byDay.keys()).sort();
  for (const day of sortedDays) {
    const v = byDay.get(day)!;
    wsDaily.addRow([day, v.count, v.qty]);
  }
  wsDaily.columns = [{ width: 14 }, { width: 12 }, { width: 10 }];

  // 3) 품목별(날짜+품목) 수량 시트
  const wsItem = wb.addWorksheet("품목별");
  wsItem.addRow([`품목별 수량 (기간: ${fromStr} ~ ${toStr})`]);
  wsItem.addRow([]);
  wsItem.addRow(["날짜", "품목", "총수량", "주문건수"]);

  const byDayItem = new Map<string, { qty: number; count: number }>();
  for (const o of orders) {
    const day = ymd(new Date(o.createdAt));
    const itemName = o.item?.name ?? "";
    const key = `${day}||${itemName}`;
    const cur = byDayItem.get(key) ?? { qty: 0, count: 0 };
    cur.qty += Number(o.quantity ?? 0);
    cur.count += 1;
    byDayItem.set(key, cur);
  }

  const sortedKeys = Array.from(byDayItem.keys()).sort((a, b) => {
    const [da, ia] = a.split("||");
    const [db, ib] = b.split("||");
    if (da !== db) return da.localeCompare(db);
    return ia.localeCompare(ib);
  });

  for (const k of sortedKeys) {
    const [day, itemName] = k.split("||");
    const v = byDayItem.get(k)!;
    wsItem.addRow([day, itemName, v.qty, v.count]);
  }

  wsItem.columns = [
    { width: 14 },
    { width: 24 },
    { width: 10 },
    { width: 10 },
  ];

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="approved_${fromStr}_${toStr}.xlsx"`,
    },
  });
}
