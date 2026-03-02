import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // ✅ 관리자 체크
    const admin = await requireAdmin(req as any);
    if (!admin) return err("관리자 권한이 필요합니다.", 401);

    const form = await req.formData();
    const clientId = String(form.get("clientId") ?? "").trim();
    const file = form.get("file") as unknown as File | null;

    if (!clientId) return err("clientId가 없습니다.");
    if (!file) return err("file이 없습니다.");

    const originalName = (file as any).name ? String((file as any).name) : "bizfile";
    const safeName = originalName.replace(/[^\w.\-가-힣 ]/g, "_");
    const key = `bizreg/${clientId}/${Date.now()}_${safeName}`;

    const blob = await put(key, file, {
      access: "public",
      contentType: (file as any).type || "application/octet-stream",
      addRandomSuffix: false,
    });

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        bizFileUrl: blob.url,
        bizFileName: safeName,
        bizFileUploadedAt: new Date(),
      },
      select: {
        id: true,
        bizFileUrl: true,
        bizFileName: true,
        bizFileUploadedAt: true,
      },
    });

    return NextResponse.json({ ok: true, client: updated });
  } catch (e: any) {
    console.error("[bizfile upload]", e);
    return err(e?.message ?? "서버 오류", 500);
  }
}