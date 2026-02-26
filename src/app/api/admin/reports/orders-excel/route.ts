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

function parseYMD(v: string | null) {
  // "YYYY-MM-DD"
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  return { y, mo, d };
}

function startOfDay({ y, mo, d }: { y: number; mo: number; d: number }) {
  return new Date(y, mo - 1, d, 0, 0, 0, 0);
}

function endExclusiveOfDay({ y, mo, d }: { y: number; mo: number; d: number }) {
  // next day 00:00 (exclusive)
  return new Date(y, mo - 1, d + 1, 0, 0, 0, 0);
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ym(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "관리자만" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  const s = parseYMD(startStr);
  const e = parseYMD(endStr);
  if (!s || !e) {
    return NextResponse.json(
      { message: "start/end는 YYYY-MM-DD 형식이어야 합니다." },
      { status: 400 }
    );
  }

  const timeMin = startOfDay(s);
  const timeMax = endExclusiveOfDay(e);

  const orders = await prisma.order.findMany({
    where: {
      status: "DONE",
      createdAt: { gte: timeMin, lt: timeMax },
    },
    orderBy: { createdAt: "asc" },
    include: {
      item: { select: { name: true } },
      user: { select: { name: true, phone: true, role: true } },
    },
  });

  const wb = new ExcelJS.Workbook();

  // 1) 원장
  const ws = wb.addWorksheet("주문원장(DONE)");
  ws.addRow([
    "날짜",
    "시간",
    "품목",
    "수량",
    "영업사원",
    "영업폰",
    "수하인명",
    "주소",
    "전화",
    "핸드폰",
    "배송메시지(message)",
    "비고(note)",
    "주문ID",
  ]);

  for (const o of orders as any[]) {
    const dt = new Date(o.createdAt);
    ws.addRow([
      ymd(dt),
      dt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      o.item?.name ?? "",
      o.quantity ?? 0,
      o.user?.name ?? "",
      o.user?.phone ?? "",
      o.receiverName ?? "",
      o.receiverAddr ?? "",
      digitsOnly(o.phone) || "",
      digitsOnly(o.mobile) || "",
      o.message ?? "",
      o.note ?? "",
      o.id ?? "",
    ]);
  }

  ws.columns = [
    { width: 12 },
    { width: 10 },
    { width: 20 },
    { width: 8 },
    { width: 12 },
    { width: 14 },
    { width: 12 },
    { width: 36 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 18 },
    { width: 28 },
  ];

  // 2) 일별 합계
  const daily = new Map<string, { qty: number; count: number }>();
  for (const o of orders as any[]) {
    const key = ymd(new Date(o.createdAt));
    const cur = daily.get(key) ?? { qty: 0, count: 0 };
    cur.qty += Number(o.quantity ?? 0);
    cur.count += 1;
    daily.set(key, cur);
  }
  const wsD = wb.addWorksheet("일별합계");
  wsD.addRow(["날짜", "출고건수", "출고수량합계"]);
  for (const key of Array.from(daily.keys()).sort()) {
    const v = daily.get(key)!;
    wsD.addRow([key, v.count, v.qty]);
  }
  wsD.columns = [{ width: 14 }, { width: 12 }, { width: 16 }];

  // 3) 월별 합계
  const monthly = new Map<string, { qty: number; count: number }>();
  for (const o of orders as any[]) {
    const key = ym(new Date(o.createdAt));
    const cur = monthly.get(key) ?? { qty: 0, count: 0 };
    cur.qty += Number(o.quantity ?? 0);
    cur.count += 1;
    monthly.set(key, cur);
  }
  const wsM = wb.addWorksheet("월별합계");
  wsM.addRow(["월(YYYY-MM)", "출고건수", "출고수량합계"]);
  for (const key of Array.from(monthly.keys()).sort()) {
    const v = monthly.get(key)!;
    wsM.addRow([key, v.count, v.qty]);
  }
  wsM.columns = [{ width: 14 }, { width: 12 }, { width: 16 }];

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orders_done.xlsx"`,
    },
  });
}
