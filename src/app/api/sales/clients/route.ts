// src/app/api/sales/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function s(v: any) {
  return String(v ?? "").trim();
}

export async function GET() {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  // ✅ Client 모델에 user 연결이 있으므로, "본인 것만" 필터
  // (ADMIN이면 전체 보여주고 싶으면 여기서 조건 분기 가능)
  const where =
    me.role === "ADMIN"
      ? {}
      : {
          userId: me.id, // ✅ 너 스키마에서 user 관계 FK가 userId인 구조일 확률이 높음
        };

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json({ ok: true, clients });
}

export async function POST(request: Request) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const data = {
    // ✅ 핵심: Client는 user 관계가 필수라서 connect 필요
    user: { connect: { id: me.id } },

    name: s(body.name),
    address: s(body.address) || null,
    ownerName: s(body.ownerName) || null,
    careInstitutionNo: s(body.careInstitutionNo) || null,
    bizRegNo: s(body.bizRegNo) || null,

    receiverName: s(body.receiverName) || null,
    receiverAddr: s(body.receiverAddr) || null,
    receiverTel: s(body.receiverTel) || null,
    receiverMobile: s(body.receiverMobile) || null,
  };

  if (!data.name) return err("NAME_REQUIRED", 400);

  const client = await prisma.client.create({
    data,
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

  return NextResponse.json({ ok: true, client });
}