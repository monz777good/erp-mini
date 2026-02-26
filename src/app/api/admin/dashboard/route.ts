import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin((user as any).role)) return null;
  return user;
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
  }

  // ✅ status 문자열은 무조건 대문자로 집계 (REQUESTED/APPROVED/REJECTED/DONE)
  const [requested, approved, rejected, done, total] = await Promise.all([
    prisma.order.count({ where: { status: "REQUESTED" } }),
    prisma.order.count({ where: { status: "APPROVED" } }),
    prisma.order.count({ where: { status: "REJECTED" } }),
    prisma.order.count({ where: { status: "DONE" } }),
    prisma.order.count({}),
  ]);

  return NextResponse.json({
    ok: true,
    counts: { total, requested, approved, rejected, done },
  });
}