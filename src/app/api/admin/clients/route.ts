import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ message: "관리자 권한 없음" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") ?? "").trim();

  const rows = await (prisma as any).client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { bizNo: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(rows);
}