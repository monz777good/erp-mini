import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  //     /  (     )
  const where =
    me.role === "ADMIN"
      ? {}
      : {
          userId: me.id,
        };

  const clients = await prisma.client.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, clients });
}