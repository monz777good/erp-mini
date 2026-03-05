import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ✅ 영업사원 거래처 목록
 * - ADMIN: 전체
 * - SALES: 본인(userId) 거래처만
 * - q= 검색(거래처명/대표자/사업자번호/요양기관번호/수하인/주소/메모)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();

    const where: any = {};
    if (user.role !== Role.ADMIN) where.userId = user.id;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { ownerName: { contains: q, mode: "insensitive" } },
        { bizRegNo: { contains: q, mode: "insensitive" } },
        { careInstitutionNo: { contains: q, mode: "insensitive" } },
        { receiverName: { contains: q, mode: "insensitive" } },
        { receiverAddr: { contains: q, mode: "insensitive" } },
        { receiverTel: { contains: q, mode: "insensitive" } },
        { receiverMobile: { contains: q, mode: "insensitive" } },
        { memo: { contains: q, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        ownerName: true,

        bizRegNo: true,
        careInstitutionNo: true,

        receiverName: true,
        receiverAddr: true,
        receiverTel: true,
        receiverMobile: true,

        memo: true,

        bizFileName: true,
        bizFileUrl: true,
        bizFileUploadedAt: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, clients });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}