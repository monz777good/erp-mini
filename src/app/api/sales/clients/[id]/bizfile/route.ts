import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const p: any = (context as any).params;
    const resolved = typeof p?.then === "function" ? await p : p;
    const id = resolved?.id;

    if (!id) {
      return NextResponse.json({ ok: false, error: "BAD_PARAMS" }, { status: 400 });
    }

    // SALES는 본인 client만, ADMIN은 전체
    const where: any = { id };
    if (user.role !== Role.ADMIN) where.userId = user.id;

    const client: any = await prisma.client.findFirst({
      where,
      select: { bizFileUrl: true, bizFileName: true },
    });

    if (!client) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const url = client.bizFileUrl ?? null;
    const name = client.bizFileName ?? "bizfile";

    if (!url) {
      return NextResponse.json({ ok: false, error: "NO_BIZFILE" }, { status: 404 });
    }

    // ✅ dataURL이면 "파일로 응답" (redirect X)
    if (String(url).startsWith("data:")) {
      const match = String(url).match(/^data:(.+?);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ ok: false, error: "BAD_DATAURL" }, { status: 400 });
      }
      const mime = match[1];
      const b64 = match[2];
      const buf = Buffer.from(b64, "base64");

      const q = new URL(req.url).searchParams;
      const download = q.get("download") === "1";

      return new NextResponse(buf, {
        headers: {
          "Content-Type": mime,
          "Content-Disposition": download
            ? `attachment; filename="${encodeURIComponent(name)}"`
            : `inline; filename="${encodeURIComponent(name)}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ✅ url이 일반 URL이면:
    // - download=1 => redirect
    // - 아니면 JSON으로 url/name 반환
    const q = new URL(req.url).searchParams;
    if (q.get("download") === "1") {
      return NextResponse.redirect(url);
    }

    return NextResponse.json({ ok: true, url, name });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}