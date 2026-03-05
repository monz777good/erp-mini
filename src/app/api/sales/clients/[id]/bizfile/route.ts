import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  // ✅ Next 16 타입검증이 params를 Promise로 보는 케이스가 있어서 이렇게 맞춰줌
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { id: clientId } = await ctx.params;

  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: "CLIENT_ID_MISSING" },
      { status: 400 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "FILE_MISSING" },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^\w.\-()]/g, "_");
  const pathname = `biz/${clientId}/${Date.now()}-${safeName}`;

  const blob = await put(pathname, file, { access: "public" });

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      bizFileUrl: blob.url,
      bizFileName: file.name,
      bizFileUploadedAt: new Date(),
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

  return NextResponse.json({ ok: true, client: updated });
}