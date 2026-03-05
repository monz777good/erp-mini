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
  if (user.role === "SALES") {
    where.user = { id: user.id };
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
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
  const receiverName = String(body.receiverName ?? "").trim();
  const receiverAddr = String(body.receiverAddr ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const mobile = String(body.mobile ?? "").trim();

  if (!name) return json(false, { error: "NAME_REQUIRED" }, 400);

  const created = await prisma.client.create({
    data: {
      name,
      receiverName: receiverName || null,
      receiverAddr: receiverAddr || null,
      phone: phone || null,
      mobile: mobile || null,
      user: { connect: { id: user.id } }, // ✅ 필수
    },
    select: {
      id: true,
      name: true,
      receiverName: true,
      receiverAddr: true,
      phone: true,
      mobile: true,
      createdAt: true,
    },
  });

  return json(true, { client: created });
}