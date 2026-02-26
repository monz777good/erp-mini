import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession(req);

  // ✅ userId ❌ → id ✅
  if (!session?.id) {
    return NextResponse.json(
      { ok: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await getSession(req);

  // ✅ userId ❌ → id ✅
  if (!session?.id) {
    return NextResponse.json(
      { ok: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const name = (body?.name ?? "").toString().trim();

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "품목명을 입력해주세요." },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: { name },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    const msg = String(err?.message ?? "");
    if (
      msg.includes("Unique constraint failed") ||
      msg.includes("UNIQUE constraint failed")
    ) {
      return NextResponse.json(
        { ok: false, message: "이미 존재하는 품목명입니다." },
        { status: 409 }
      );
    }
    console.error("ITEMS POST ERROR:", err);
    return NextResponse.json({ ok: false, message: "서버 오류" }, { status: 500 });
  }
}