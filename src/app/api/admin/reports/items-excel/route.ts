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
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

function startOfDay({ y, mo, d }: { y: number; mo: number; d: number }) {
  return new Date(y, mo - 1, d, 0, 0, 0, 0);
}

function endExclusiveOfDay({ y, mo, d }: { y: number; mo: number; d: number }) {
  return new Date(y, mo - 1, d + 1, 0, 0, 0, 0);
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
    include: { item: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, { qty: number; count: number }>();
  for (const o of orders as any[]) {
    const name = String(o.item?.name ?? "");
    const cur = map.get(name) ?? { qty: 0, count: 0 };
    cur.qty += Number(o.quantity ?? 0);
    cur.count += 1;
    map.set(name, cur);
  }

  const rows = Array.from(map.entries())
    .map(([name, v]) => ({ name, count: v.count, qty: v.qty }))
    .sort((a, b) => b.qty - a.qty);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("품목별출고(DONE)");
  ws.addRow(["품목", "출고건수", "출고수량합계"]);

  for (const r of rows) {
    ws.addRow([r.name, r.count, r.qty]);
  }

  ws.columns = [{ width: 26 }, { width: 12 }, { width: 16 }];

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="items_done.xlsx"`,
    },
  });
}
