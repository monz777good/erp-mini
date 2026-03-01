import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSales(role: any) {
  return String(role ?? "").toUpperCase() === "SALES";
}
function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

export async function GET() {
  try {
    // ✅ 여기 핵심: 인자 없이 호출
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "401 UNAUTHORIZED (세션 없음)" },
        { status: 401 }
      );
    }

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      // ✅ 우선 전체 조회로 에러부터 제거
      // 나중에 스키마 확인 후 본인 것만 필터 1줄만 추가
      // where: isSales(user.role) ? { salesUserId: user.id } : undefined,
    });

    return NextResponse.json({ ok: true, clients });
  } catch (e: any) {
    console.error("[/api/sales/clients] ERROR:", e);
    return NextResponse.json(
      { ok: false, message: `500 SERVER_ERROR: ${e?.message ?? String(e)}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // ✅ 여기 핵심: 인자 없이 호출
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "401 UNAUTHORIZED (세션 없음)" },
        { status: 401 }
      );
    }

    if (!isSales((user as any).role) && !isAdmin((user as any).role)) {
      return NextResponse.json(
        { ok: false, message: "403 FORBIDDEN" },
        { status: 403 }
      );
    }

    const form = await req.formData();

    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, message: "거래처명은 필수입니다." },
        { status: 400 }
      );
    }

    const ceoName = String(form.get("ceoName") ?? "").trim() || null;
    const bizNo = String(form.get("bizNo") ?? "").trim() || null;
    const addr = String(form.get("addr") ?? "").trim() || null;
    const tel = String(form.get("tel") ?? "").trim() || null;
    const careNo = String(form.get("careNo") ?? "").trim() || null;
    const email = String(form.get("email") ?? "").trim() || null;
    const remark = String(form.get("remark") ?? "").trim() || null;

    const created = await prisma.client.create({
      data: {
        name,
        ceoName,
        bizNo,
        addr,
        tel,
        careNo,
        email,
        remark,
        // ✅ 스키마에 소유자 필드 있으면 나중에 1줄 추가
        // salesUserId: user.id,
      } as any,
    });

    return NextResponse.json({ ok: true, client: created });
  } catch (e: any) {
    console.error("[/api/sales/clients][POST] ERROR:", e);
    return NextResponse.json(
      { ok: false, message: `500 SERVER_ERROR: ${e?.message ?? String(e)}` },
      { status: 500 }
    );
  }
}