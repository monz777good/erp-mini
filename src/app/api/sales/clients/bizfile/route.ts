import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const form = await req.formData();

  const file = form.get("file") as File | null;
  const clientId = String(form.get("clientId") || "");

  if (!file || !clientId) {
    return NextResponse.json({ ok: false, error: "FILE_OR_CLIENT_MISSING" }, { status: 400 });
  }

  // ✅ 영업사원 본인 거래처만 업로드 가능(보안)
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: user.id },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ ok: false, error: "NO_PERMISSION" }, { status: 403 });
  }

  const blob = await put(`biz/${Date.now()}-${file.name}`, file, { access: "public" });

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      bizFileUrl: blob.url,
      bizFileName: file.name,
      bizFileUploadedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, client: updated });
}