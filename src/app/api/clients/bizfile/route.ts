// src/app/api/sales/clients/bizfile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  const me = await requireUser();
  if (me instanceof NextResponse) return me;

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

  // ✅ client 존재 확인만 (salesId 없음)
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) return err("CLIENT_NOT_FOUND", 404);

  // ✅ 업로드 저장(간단/확실): DB에 base64로 넣지 말고 URL만 저장해야 함
  // 여기서는 "업로드된 파일을 저장할 스토리지"가 필요함.
  // 너 프로젝트는 Vercel Blob 쓰는 구조였으니 그걸 그대로 사용.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return err("BLOB_TOKEN_MISSING", 500);

  const { put } = await import("@vercel/blob");

  const ext = (() => {
    const name = file.name || "bizfile";
    const idx = name.lastIndexOf(".");
    return idx >= 0 ? name.slice(idx) : "";
  })();

  const safeName = `biz/${clientId}/${Date.now()}${ext}`;

  const uploaded = await put(safeName, file, {
    access: "public",
    token,
  });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      bizFileUrl: uploaded.url,
      bizFileName: file.name || "bizfile",
      bizFileUploadedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, url: uploaded.url });
}