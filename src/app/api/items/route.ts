import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireUser(req: Request) {
  const user = await getSessionUser(req as any);
  return user ?? null;
}

async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

// ✅ GET: 로그인만 되어있으면 누구나 조회 가능 (영업사원 주문 화면에서 써야함)
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
  }

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
  });

  // ✅ 응답 구조 고정: { ok:true, items:[...] }
  return NextResponse.json({ ok: true, items });
}

// ✅ POST: 관리자만 추가
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "관리자만 품목을 추가할 수 있습니다." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, message: "품목명이 비었습니다." }, { status: 400 });
  }

  try {
    const created = await prisma.item.create({ data: { name } });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "추가 실패(중복일 수 있음)", error: String(e?.message ?? e) },
      { status: 400 }
    );
  }
}

// ✅ DELETE: 관리자만 삭제 (query ?id=)
export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "관리자만 품목을 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "id가 필요합니다." }, { status: 400 });
  }

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}