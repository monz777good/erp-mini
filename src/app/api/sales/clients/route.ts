import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const where =
    user.role === "ADMIN"
      ? {}
      : {
          userId: user.id,
        };

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,

      // 거래처 기본정보
      address: true,
      ownerName: true,
      careInstitutionNo: true,
      bizRegNo: true,

      // ✅ 주문요청 자동채움 핵심 4개
      receiverName: true,
      receiverAddr: true,
      receiverTel: true,
      receiverMobile: true,

      // 사업자등록증
      bizFileUrl: true,
      bizFileName: true,
      bizFileUploadedAt: true,

      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, clients });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
  }

  const created = await prisma.client.create({
    data: {
      userId: user.id,
      name,

      address: body?.address ?? null,
      ownerName: body?.ownerName ?? null,
      careInstitutionNo: body?.careInstitutionNo ?? null,
      bizRegNo: body?.bizRegNo ?? null,

      receiverName: body?.receiverName ?? null,
      receiverAddr: body?.receiverAddr ?? null,
      receiverTel: body?.receiverTel ?? null,
      receiverMobile: body?.receiverMobile ?? null,
    },
    select: {
      id: true,
      name: true,
      address: true,
      ownerName: true,
      careInstitutionNo: true,
      bizRegNo: true,
      receiverName: true,
      receiverAddr: true,
      receiverTel: true,
      receiverMobile: true,
      bizFileUrl: true,
      bizFileName: true,
      bizFileUploadedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, client: created });
}