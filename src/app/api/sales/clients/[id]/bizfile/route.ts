import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ✅ 영업사원: 거래처 사업자등록증 조회/다운로드
 * - 기본: JSON { url, name }
 * - ?download=1 : 파일 URL로 redirect
 *
 * ✅ Next 16 Turbopack 타입 이슈 대응:
 *    context.params 가 Promise로 들어오는 케이스가 있어
 *    params를 Promise로 받고 await 처리한다.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // ✅ params가 Promise일 수도 있어서 안전 처리
    const p: any = (context as any).params;
    const resolved = typeof p?.then === "function" ? await p : p;
    const id = resolved?.id;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "BAD_PARAMS" },
        { status: 400 }
      );
    }

    const client: any = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // ✅ 프로젝트마다 필드명이 다를 수 있어 후보를 넓게 처리
    const url =
      client.bizFileUrl ??
      client.bizFileURL ??
      client.biz_file_url ??
      client.businessFileUrl ??
      client.businessFileURL ??
      null;

    const name =
      client.bizFileName ??
      client.biz_file_name ??
      client.businessFileName ??
      "bizfile";

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "NO_BIZFILE" },
        { status: 404 }
      );
    }

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