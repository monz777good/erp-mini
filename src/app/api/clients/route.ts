// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}
function s(v: any) {
  return String(v ?? "").trim();
}

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const rows = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ ok: true, rows });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("BAD_REQUEST");
  }

  const name = s(body.name);
  if (!name) return err("NAME_REQUIRED");

  const bizFileUrl = s(body.bizFileUrl) || null;
  const bizFileName = s(body.bizFileName) || null;

  const created = await prisma.client.create({
    data: {
      name,
      bizFileUrl,
      bizFileName,
      bizFileUploadedAt: bizFileUrl ? new Date() : null,
    } as any,
  });

  return NextResponse.json({ ok: true, row: created });
}