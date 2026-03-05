import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    //  : req   (  + )
    requireAdmin();

    //   price  select   (Item  price )
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        item: { select: { name: true } },
        user: { select: { name: true, phone: true } },
        client: { select: { id: true, name: true } },
      },
    });

    //    statement /  (    ok)
    const imgPath = path.join(process.cwd(), "public", "templates", "statement.png");
    const hasTemplate = fs.existsSync(imgPath);

    return NextResponse.json({
      ok: true,
      hasTemplate,
      count: rows.length,
      rows,
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e);

    if (msg.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}