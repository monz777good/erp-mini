import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ message: "관리자 권한 없음" }, { status: 403 });

  const items = await prisma.item.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ message: "관리자 권한 없음" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "품목명 필요" }, { status: 400 });

  const created = await prisma.item.create({ data: { name } });
  return NextResponse.json(created);
}