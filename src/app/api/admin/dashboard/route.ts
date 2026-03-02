// src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    // ✅ 대시보드에 필요한 값들(예시)
    const [requested, approved, rejected, done] = await Promise.all([
      prisma.order.count({ where: { status: "REQUESTED" } }),
      prisma.order.count({ where: { status: "APPROVED" } }),
      prisma.order.count({ where: { status: "REJECTED" } }),
      prisma.order.count({ where: { status: "DONE" } }),
    ]);

    return NextResponse.json({
      ok: true,
      counts: { requested, approved, rejected, done },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}