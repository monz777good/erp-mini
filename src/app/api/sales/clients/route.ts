import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      owner: true,
      bizNo: true,
      ykiho: true,
      addr: true,
      phone: true,
      mobile: true,
      note: true,
      createdAt: true,
      bizFileName: true,
      bizFileMime: true,
      // ⚠️ 목록에선 data는 안 보냄(무거움)
    },
  });

  return NextResponse.json({ ok: true, clients });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "NAME_REQUIRED" },
      { status: 400 }
    );
  }

  // ✅ 파일(사업자등록증) - base64 데이터(문자열)로 저장
  // body.bizFileData 는 "data:application/pdf;base64,...." 형태로 들어옴
  const bizFileName = body?.bizFileName ? String(body.bizFileName) : null;
  const bizFileMime = body?.bizFileMime ? String(body.bizFileMime) : null;
  const bizFileData = body?.bizFileData ? String(body.bizFileData) : null;

  // (선택) 너무 큰 파일 방지 (대략 6MB 정도 제한)
  if (bizFileData && bizFileData.length > 6_000_000) {
    return NextResponse.json(
      { ok: false, error: "FILE_TOO_LARGE" },
      { status: 413 }
    );
  }

  const created = await prisma.client.create({
    data: {
      name,
      owner: body?.owner ? String(body.owner) : null,
      bizNo: body?.bizNo ? String(body.bizNo) : null,
      ykiho: body?.ykiho ? String(body.ykiho) : null,
      addr: body?.addr ? String(body.addr) : null,
      phone: body?.phone ? String(body.phone) : null,
      mobile: body?.mobile ? String(body.mobile) : null,
      note: body?.note ? String(body.note) : null,

      bizFileName,
      bizFileMime,
      bizFileData,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id });
}