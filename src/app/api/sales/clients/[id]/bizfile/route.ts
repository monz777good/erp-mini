import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  // ✅ Next 16 타입 이슈 대응: params가 Promise로 들어오는 케이스
  const { id: clientId } = await ctx.params;

  if (!clientId) return json(false, { error: "CLIENT_ID_REQUIRED" }, 400);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return json(false, { error: "BLOB_TOKEN_MISSING" }, 400);

  const form = await req.formData().catch(() => null);
  if (!form) return json(false, { error: "BAD_FORMDATA" }, 400);

  const file = form.get("file");
  if (!(file instanceof File)) return json(false, { error: "FILE_REQUIRED" }, 400);

  // ✅ 권한 체크: SALES는 본인 거래처만 업로드 가능
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, userId: true },
  });
  if (!client) return json(false, { error: "CLIENT_NOT_FOUND" }, 404);
  if (user.role === "SALES" && client.userId !== user.id) return json(false, { error: "FORBIDDEN" }, 403);

  const keySafe = file.name.replace(/[^\w.\-]+/g, "_");
  const blob = await put(`bizfiles/${clientId}/${Date.now()}_${keySafe}`, file, {
    access: "public",
    token,
  });

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      bizFileUrl: blob.url,
      bizFileName: file.name,
      bizFileUploadedAt: new Date(),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      bizFileUrl: true,
      bizFileName: true,
      bizFileUploadedAt: true,
    },
  });

  return json(true, { bizfile: updated });
}