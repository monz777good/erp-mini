import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const where: any = {};
  if (user.role === "SALES") where.user = { id: user.id };

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

  return json(true, { clients });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body) return json(false, { error: "BAD_JSON" }, 400);

  const name = String(body.name ?? "").trim();
  if (!name) return json(false, { error: "NAME_REQUIRED" }, 400);

  const address = String(body.address ?? "").trim();
  const ownerName = String(body.ownerName ?? "").trim();
  const careInstitutionNo = String(body.careInstitutionNo ?? "").trim();
  const bizRegNo = String(body.bizRegNo ?? "").trim();

  const receiverName = String(body.receiverName ?? "").trim();
  const receiverAddr = String(body.receiverAddr ?? "").trim();
  const receiverTel = String(body.receiverTel ?? "").trim();
  const receiverMobile = String(body.receiverMobile ?? "").trim();

  const created = await prisma.client.create({
    data: {
      name,
      address: address || null,
      ownerName: ownerName || null,
      careInstitutionNo: careInstitutionNo || null,
      bizRegNo: bizRegNo || null,
      receiverName: receiverName || null,
      receiverAddr: receiverAddr || null,
      receiverTel: receiverTel || null,
      receiverMobile: receiverMobile || null,
      user: { connect: { id: user.id } }, // ✅ 필수
      updatedAt: new Date(),
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

  return json(true, { client: created });
}