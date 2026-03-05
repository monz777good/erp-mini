import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, items });
}