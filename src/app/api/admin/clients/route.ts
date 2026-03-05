// src/app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

// ✅ "YYYY-MM-DD"를 KST 기준 시작/끝 Date로 변환
function kstRange(from?: string | null, to?: string | null) {
  const f = (from ?? "").trim();
  const t = (to ?? "").trim();
  if (!f && !t) return null;

  const fromDate = f ? new Date(`${f}T00:00:00+09:00`) : null;
  const toDate = t ? new Date(`${t}T23:59:59.999+09:00`) : null;

  const gte = fromDate && !isNaN(fromDate.getTime()) ? fromDate : null;
  const lte = toDate && !isNaN(toDate.getTime()) ? toDate : null;

  if (!gte && !lte) return null;

  return { gte, lte };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");     // YYYY-MM-DD

  const range = kstRange(from, to);

  const where: any = {};
  if (range) {
    where.createdAt = {};
    if (range.gte) where.createdAt.gte = range.gte;
    if (range.lte) where.createdAt.lte = range.lte;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { careInstitutionNo: { contains: q, mode: "insensitive" } },
      { bizRegNo: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { memo: { contains: q, mode: "insensitive" } },
      { receiverTel: { contains: q, mode: "insensitive" } },
      { receiverMobile: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q, mode: "insensitive" } } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,

      name: true,
      address: true,
      memo: true,

      careInstitutionNo: true,
      bizRegNo: true,

      receiverTel: true,
      receiverMobile: true,

      bizFileUrl: true,
      bizFileName: true,
      bizFileUploadedAt: true,

      user: { select: { name: true, phone: true } },
    },
  });

  // ✅ 프론트에서 쓰기 편하게 flatten
  const rows = clients.map((c) => ({
    id: c.id,
    createdAt: c.createdAt,

    salesName: c.user?.name ?? "",
    salesPhone: c.user?.phone ?? "",

    name: c.name ?? "",
    address: c.address ?? "",
    note: c.memo ?? "",

    instNo: c.careInstitutionNo ?? "",
    bizNo: c.bizRegNo ?? "",

    phone: c.receiverTel ?? "",
    mobile: c.receiverMobile ?? "",

    bizFileUrl: c.bizFileUrl ?? null,
    bizFileName: c.bizFileName ?? null,
    bizFileUploadedAt: c.bizFileUploadedAt ?? null,
  }));

  return NextResponse.json({ ok: true, rows });
}