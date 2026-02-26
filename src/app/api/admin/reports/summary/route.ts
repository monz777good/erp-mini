import { NextResponse } from "next/server";
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
  const s = parseYMD(searchParams.get("start"));
  const e = parseYMD(searchParams.get("end"));
  if (!s || !e) {
    return NextResponse.json({ message: "start/end는 YYYY-MM-DD 형식" }, { status: 400 });
  }

  const timeMin = startOfDay(s);
  const timeMax = endExclusiveOfDay(e);

  const orders = await prisma.order.findMany({
    where: { status: "DONE", createdAt: { gte: timeMin, lt: timeMax } },
    select: { id: true, quantity: true, createdAt: true, item: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const count = orders.length;
  const totalQty = orders.reduce((sum, o) => sum + Number(o.quantity ?? 0), 0);

  const byItem = new Map<string, { qty: number; count: number }>();
  for (const o of orders as any[]) {
    const name = String(o.item?.name ?? "");
    const cur = byItem.get(name) ?? { qty: 0, count: 0 };
    cur.qty += Number(o.quantity ?? 0);
    cur.count += 1;
    byItem.set(name, cur);
  }

  const topItems = Array.from(byItem.entries())
    .map(([name, v]) => ({ name, count: v.count, qty: v.qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return NextResponse.json({ count, totalQty, topItems });
}
