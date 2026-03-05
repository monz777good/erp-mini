// src/app/api/clients/bizfile/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("BAD_FORMDATA");
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) return err("FILE_REQUIRED");

  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
  const key = `biz/${Date.now()}_${safeName}`;

  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({ ok: true, url: blob.url, name: safeName });
}