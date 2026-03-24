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

async function findEditableClient(id: string, me: any) {
  if (me.role === "ADMIN") {
    return prisma.client.findUnique({
      where: { id },
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
        userId: true,
      },
    });
  }

  return prisma.client.findFirst({
    where: {
      id,
      userId: me.id,
    },
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
      userId: true,
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const { id } = await context.params;
  const clientId = s(id);
  if (!clientId) return err("CLIENT_ID_REQUIRED", 400);

  const client = await findEditableClient(clientId, me);
  if (!client) return err("CLIENT_NOT_FOUND", 404);

  return NextResponse.json({ ok: true, client });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const { id } = await context.params;
  const clientId = s(id);
  if (!clientId) return err("CLIENT_ID_REQUIRED", 400);

  const target = await findEditableClient(clientId, me);
  if (!target) return err("CLIENT_NOT_FOUND", 404);

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const name = s(body.name);
  if (!name) return err("NAME_REQUIRED", 400);

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      address: s(body.address) || null,
      ownerName: s(body.ownerName) || null,
      careInstitutionNo: s(body.careInstitutionNo) || null,
      bizRegNo: s(body.bizRegNo) || null,
      email: s(body.email) || null,
      receiverName: s(body.receiverName) || null,
      receiverAddr: s(body.receiverAddr) || null,
      receiverTel: s(body.receiverTel) || null,
      receiverMobile: s(body.receiverMobile) || null,
      updatedAt: new Date(),
    },
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
      userId: true,
    },
  });

  return NextResponse.json({ ok: true, client: updated });
}