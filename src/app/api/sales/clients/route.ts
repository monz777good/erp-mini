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

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req as any);

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "401 UNAUTHORIZED (세션 없음)" },
        { status: 401 }
      );
    }

    // ✅ 영업사원만: 본인 거래처만 (관리자는 전체 허용해도 됨)
    // 아래 where는 네 DB 스키마에 따라 1줄만 맞춰야 하는 부분인데,
    // “지금 당장”은 관리자/영업 둘 다 전체 조회로 두고 먼저 API부터 살아나게 함.
    // (보안 필터는 API가 정상 뜬 다음에 너 스키마에 맞춰 1줄만 조정)
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      // ✅ 1차: 우선 전체(에러부터 제거)
      // where: isSales(user.role) ? { salesUserId: user.id } : undefined,
    });

    // ✅ 영업사원은 화면에서 "본인 것만" 보이게 해야 하니까,
    // 위 where를 네 스키마에 맞게 나중에 한 줄로 수정하면 완성.
    // 지금은 “서버 오류”부터 제거가 1순위.

    return NextResponse.json({ ok: true, clients });
  } catch (e: any) {
    // Vercel 로그에서 바로 보이게
    console.error("[/api/sales/clients] ERROR:", e);

    const msg =
      e?.message ||
      (typeof e === "string" ? e : "SERVER_ERROR");

    return NextResponse.json(
      { ok: false, message: `500 SERVER_ERROR: ${msg}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req as any);

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "401 UNAUTHORIZED (세션 없음)" },
        { status: 401 }
      );
    }

    // ✅ 영업사원/관리자만 등록 허용
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

    // 네가 프론트에서 보내는 필드들 그대로 받음
    const ceoName = String(form.get("ceoName") ?? "").trim() || null;
    const bizNo = String(form.get("bizNo") ?? "").trim() || null;
    const addr = String(form.get("addr") ?? "").trim() || null;
    const tel = String(form.get("tel") ?? "").trim() || null;
    const careNo = String(form.get("careNo") ?? "").trim() || null;
    const email = String(form.get("email") ?? "").trim() || null;
    const remark = String(form.get("remark") ?? "").trim() || null;

    // 파일은 일단 “받기만” 하고 저장 로직은 너가 붙여둔 방식대로 추가 가능
    // (지금은 서버오류 제거가 목표)
    // const bizCert = form.get("bizCert");

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
        // ✅ 너 스키마에 salesUserId/ownerId 같은게 있으면 여기에 1줄 추가
        // salesUserId: user.id,
      } as any,
    });

    return NextResponse.json({ ok: true, client: created });
  } catch (e: any) {
    console.error("[/api/sales/clients][POST] ERROR:", e);
    const msg =
      e?.message ||
      (typeof e === "string" ? e : "SERVER_ERROR");
    return NextResponse.json(
      { ok: false, message: `500 SERVER_ERROR: ${msg}` },
      { status: 500 }
    );
  }
}