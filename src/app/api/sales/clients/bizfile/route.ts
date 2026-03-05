import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return err("BLOB_TOKEN_MISSING", 500);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("BAD_FORMDATA");
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) return err("FILE_REQUIRED");

  const safeName = String(file.name || "bizfile")
    .replace(/[^\w.\-() ]/g, "_")
    .slice(0, 120);

  const key = `bizfiles/${Date.now()}_${safeName}`;

  try {
    const blob = await put(key, file, {
      access: "public",
      token,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      name: safeName,
      size: file.size,
      type: file.type,
    });
  } catch (e: any) {
    return err(e?.message || "UPLOAD_FAILED", 500);
  }
}