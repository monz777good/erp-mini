import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  // ✅ 여기서 price는 절대 select 하지 않는다 (Item 모델에 price 없음)
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      item: { select: { name: true } },
      user: { select: { name: true, phone: true } },
      client: { select: { id: true, name: true } },
    },
  });

  // 원래 너가 만들던 statement 이미지/파일 로직 유지용(있으면 쓰고 없으면 그냥 ok)
  const imgPath = path.join(process.cwd(), "public", "templates", "statement.png");
  const hasTemplate = fs.existsSync(imgPath);

  return NextResponse.json({
    ok: true,
    hasTemplate,
    count: rows.length,
    rows,
  });
}