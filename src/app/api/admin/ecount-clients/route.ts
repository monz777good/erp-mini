import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: any) {
  return String(v ?? "").trim();
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const q = s(searchParams.get("q"));

  const where: any = {};

  if (q) {
    where.name = {
      contains: q,
      mode: "insensitive",
    };
  }

  const rows = await prisma.ecountClient.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return NextResponse.json({
    ok: true,
    rows,
  });
}