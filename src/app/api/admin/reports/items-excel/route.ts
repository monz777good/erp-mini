import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 * ✅ 품목 리포트(JSON)
 */
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const items = await prisma.item.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    if (String(e?.message ?? "").startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (String(e?.message ?? "").startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}