import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

async function requireUser() {
  const user = await getSessionUser(); // ✅ 인자 없이 호출 (0 arguments)
  return user ?? null;
}

// ✅ GET: 로그인된 유저면 누구나 품목 조회 가능
export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "로그인 필요" }, { status: 401 });
  }

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}