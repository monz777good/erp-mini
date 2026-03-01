import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = requireAdminUser();
  if (!admin) return NextResponse.json({ message: "관리자 권한 없음" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") ?? "").trim();

  const where =
    q.length >= 1
      ? {
          OR: [
            { name: { contains: q } },
            { bizNo: { contains: q } },
            { instNo: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { address: { contains: q } },
            { note: { contains: q } },
            { salesName: { contains: q } },
          ],
        }
      : {};

  const rows = await (prisma as any).client.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows);
}