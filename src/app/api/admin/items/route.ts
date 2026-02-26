import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

/**
 * GET /api/admin/items
 */
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, message: "관리자만" }, { status: 403 });

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, items });
}

/**
 * POST /api/admin/items
 * body: { name }
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, message: "관리자만" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();

  if (!name) return NextResponse.json({ ok: false, message: "품목명이 필요합니다." }, { status: 400 });

  try {
    const created = await prisma.item.create({ data: { name } });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "품목 추가 실패", error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/items
 * body: { id, name }
 * ✅ 품목명 변경(주문에 사용된 품목도 안전하게 변경 가능)
 */
export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, message: "관리자만" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  const name = String(body?.name ?? "").trim();

  if (!id) return NextResponse.json({ ok: false, message: "id가 필요합니다." }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, message: "변경할 품목명이 필요합니다." }, { status: 400 });

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    // 같은 이름 중복(UNIQUE)일 가능성이 큼
    const msg = String(e?.message ?? e);
    if (msg.toLowerCase().includes("unique") || msg.includes("P2002")) {
      return NextResponse.json({ ok: false, message: "이미 존재하는 품목명입니다." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, message: "품목명 변경 실패", error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/items?id=...
 * ✅ 주문에 사용된 품목은 삭제 금지
 */
export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, message: "관리자만" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") ?? "").trim();

  if (!id) return NextResponse.json({ ok: false, message: "id가 필요합니다." }, { status: 400 });

  try {
    const usedCount = await prisma.order.count({ where: { itemId: id } });
    if (usedCount > 0) {
      return NextResponse.json(
        { ok: false, message: `이 품목은 이미 주문(${usedCount}건)에 사용되어 삭제할 수 없습니다. (대신 품목명 변경 추천)`, usedCount },
        { status: 409 }
      );
    }

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("P2003") || msg.toLowerCase().includes("foreign key")) {
      return NextResponse.json(
        { ok: false, message: "이 품목은 주문에 연결되어 있어 삭제할 수 없습니다. (주문에 사용된 품목은 삭제 불가)" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, message: "삭제 실패", error: msg }, { status: 500 });
  }
}
