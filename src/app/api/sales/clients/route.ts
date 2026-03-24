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

  const where =
    me.role === "ADMIN"
      ? {}
      : {
          userId: me.id,
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
      email: true,

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
    user: { connect: { id: me.id } },

    name: s(body.name),
    address: s(body.address) || null,
    ownerName: s(body.ownerName) || null,
    careInstitutionNo: s(body.careInstitutionNo) || null,
    bizRegNo: s(body.bizRegNo) || null,
    email: s(body.email) || null,

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
      email: true,

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