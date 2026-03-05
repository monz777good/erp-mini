// src/app/api/sales/clients/bizfile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return err("BLOB_TOKEN_MISSING", 500);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err("BAD_FORMDATA", 400);
  }

  const clientId = String(form.get("clientId") ?? "").trim();
  const file = form.get("file");

  if (!clientId) return err("CLIENT_ID_REQUIRED", 400);
  if (!(file instanceof File)) return err("FILE_REQUIRED", 400);

  // ✅ salesId 같은거 절대 쓰지 말기 (Client 모델에 없음)
  const exists = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!exists) return err("CLIENT_NOT_FOUND", 404);

  const original = file.name || "bizfile";
  const dot = original.lastIndexOf(".");
  const ext = dot >= 0 ? original.slice(dot) : "";
  const key = `biz/${clientId}/${Date.now()}${ext}`;

  const uploaded = await put(key, file, {
    access: "public",
    token,
  });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      bizFileUrl: uploaded.url,
      bizFileName: original,
      bizFileUploadedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, url: uploaded.url });
}