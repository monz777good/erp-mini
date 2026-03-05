import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  //    (req    )
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const form = await req.formData();

    const clientId = String(form.get("clientId") ?? "");
    const file = form.get("file");

    if (!clientId) {
      return NextResponse.json({ ok: false, error: "CLIENT_ID_REQUIRED" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "FILE_REQUIRED" }, { status: 400 });
    }

    //     ,
    //  DB  ( )   .
    // (Vercel Blob    put()  URL  )

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        bizFileName: file.name,
        // bizFileUrl: "TODO",
        // bizFileUploadedAt: new Date(),
      },
      select: { id: true, bizFileName: true, bizFileUrl: true },
    });

    return NextResponse.json({ ok: true, client: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}