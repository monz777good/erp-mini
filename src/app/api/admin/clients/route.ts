import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: any) {
  return String(v ?? "").trim();
}

function kstRange(fromYmd: string, toYmd: string) {
  const from = new Date(`${fromYmd}T00:00:00+09:00`);
  const to = new Date(`${toYmd}T23:59:59.999+09:00`);
  return { from, to };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);

  const fromYmd = s(searchParams.get("from"));
  const toYmd = s(searchParams.get("to"));
  const q = s(searchParams.get("q"));

  const where: any = {};

  if (fromYmd && toYmd) {
    const { from, to } = kstRange(fromYmd, toYmd);
    where.createdAt = { gte: from, lte: to };
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { bizRegNo: { contains: q, mode: "insensitive" } },
      { careInstitutionNo: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { receiverName: { contains: q, mode: "insensitive" } },
      { receiverAddr: { contains: q, mode: "insensitive" } },
      { receiverTel: { contains: q, mode: "insensitive" } },
      { receiverMobile: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { user: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const rows = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      name: true,
      bizRegNo: true,
      careInstitutionNo: true,
      address: true,
      receiverTel: true,
      receiverMobile: true,
      ownerName: true,
      bizFileUrl: true,
      bizFileName: true,
      bizFileUploadedAt: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    rows: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      name: r.name,
      bizRegNo: r.bizRegNo,
      careInstitutionNo: r.careInstitutionNo,
      address: r.address,
      receiverTel: r.receiverTel,
      receiverMobile: r.receiverMobile,
      ownerName: r.ownerName,
      bizFileUrl: r.bizFileUrl,
      bizFileName: r.bizFileName,
      bizFileUploadedAt: r.bizFileUploadedAt,
      userId: r.userId,
      salesName: r.user?.name ?? "-",
    })),
  });
}