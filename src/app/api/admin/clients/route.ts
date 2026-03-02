import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // ✅ 네 프로젝트 방식 유지(0인자 호출)
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ message: "관리자 권한 없음" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") ?? "").trim();

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { bizRegNo: { contains: q } },
            { receiverAddr: { contains: q } },
            { receiverTel: { contains: q } },
            { receiverMob: { contains: q } },
            { memo: { contains: q } },
            { bizFileName: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // ✅ 프론트가 기대하는 필드명으로 매핑
  const rows = clients.map((c) => ({
    id: c.id,
    createdAt: c.createdAt,

    // 네 화면에 있는데 서버에서 안 주는 값들 → 일단 "-"
    salesName: "-",
    instNo: "-",
    email: "-",

    name: c.name ?? "-",
    bizNo: c.bizRegNo ?? "-",              // ✅ 매핑
    address: c.receiverAddr ?? "-",        // ✅ 매핑
    phone: c.receiverTel ?? c.receiverMob ?? "-", // ✅ 매핑(둘 중 있으면)
    note: c.memo ?? "-",                   // ✅ 매핑

    // ✅ 사업자등록증 (추가 표시/업로드용)
    bizFileUrl: (c as any).bizFileUrl ?? null,
    bizFileName: (c as any).bizFileName ?? null,
  }));

  return NextResponse.json(rows);
}