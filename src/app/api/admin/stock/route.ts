// src/app/api/admin/stock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

// ✅ 재고 목록: (프론트가 Array.isArray(data)로 받으니 "배열"로 바로 반환)
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, bundleV: true, stockV: true },
  });

  // ✅ stock 화면은 packV라는 이름을 쓰므로 매핑해서 내려줌
  const rows = items.map((it) => ({
    id: it.id,
    name: it.name,
    packV: it.bundleV ?? 1,
    stockV: it.stockV ?? 0,
  }));

  return NextResponse.json(rows);
}

// ✅ 재고 저장: packV(=bundleV) 갱신 + addV만큼 stockV 누적 증가
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  const packV = Number(body?.packV ?? NaN);
  const addV = Number(body?.addV ?? NaN);

  if (!id) return err("id가 필요합니다.");
  if (!Number.isFinite(packV) || packV <= 0) return err("묶음(V)은 1 이상 숫자만 가능합니다.");
  if (!Number.isFinite(addV) || addV < 0) return err("추가재고(V)는 0 이상 숫자만 가능합니다.");

  // 현재 stockV 읽고 누적 반영
  const cur = await prisma.item.findUnique({
    where: { id },
    select: { stockV: true },
  });
  if (!cur) return err("해당 품목을 찾을 수 없습니다.", 404);

  const nextStock = (cur.stockV ?? 0) + Math.floor(addV);

  const updated = await prisma.item.update({
    where: { id },
    data: {
      bundleV: Math.floor(packV),
      stockV: nextStock,
      // extraV도 "추가재고 누적" 의미로 같이 올려두면 나중에 추적에 도움됨 (원하면 지워도 됨)
      extraV: { increment: Math.floor(addV) },
    },
    select: { id: true, name: true, bundleV: true, stockV: true },
  });

  // ✅ 프론트는 Row 형태를 원함
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    packV: updated.bundleV ?? 1,
    stockV: updated.stockV ?? 0,
  });
}