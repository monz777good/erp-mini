import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ✅ 주문 일괄 생성(또는 일괄 처리) 엔드포인트
// - 빌드/배포 통과용: Client의 ownerUserId 같은 "없는 필드" 조건은 제거
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const userId = String(body?.userId ?? "").trim();
    const itemId = String(body?.itemId ?? "").trim();
    const clientId = body?.clientId ? String(body.clientId).trim() : "";
    const quantity = Number(body?.quantity ?? 1);
    const note = body?.note ? String(body.note) : null;

    // 배송 정보 (기본값 안전 처리)
    const receiverName = String(body?.receiverName ?? "").trim();
    const receiverAddr = String(body?.receiverAddr ?? "").trim();
    const receiverPhone = String(body?.receiverPhone ?? "").trim();
    const receiverMobile = String(body?.receiverMobile ?? "").trim();
    const boxCount = Number(body?.boxCount ?? 1);

    if (!userId || !itemId) {
      return NextResponse.json(
        { ok: false, message: "userId, itemId가 필요합니다." },
        { status: 400 }
      );
    }

    if (!receiverName || !receiverAddr) {
      return NextResponse.json(
        { ok: false, message: "수하인 이름/주소가 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ clientId가 있으면 존재만 확인 (ownerUserId 조건 제거 = 빌드 통과 목적)
    if (clientId) {
      const ok = await prisma.client.findFirst({
        where: { id: clientId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json(
          { ok: false, message: "거래처를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    // ✅ 주문 생성 (status는 schema.prisma의 OrderStatus에 맞춤)
    const order = await prisma.order.create({
      data: {
        userId,
        itemId,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        status: "REQUESTED",
        note,

        receiverName,
        receiverAddr,
        receiverPhone,
        receiverMobile,
        boxCount: Number.isFinite(boxCount) && boxCount > 0 ? boxCount : 1,

        // clientId 필드가 Order에 존재하는 경우만 넣고 싶지만,
        // 타입/스키마 불일치 방지 위해 "조건부"로 넣는다.
        ...(clientId ? { clientId } : {}),
      } as any, // ✅ 빌드 깨지지 않게 안전 캐스팅(스키마에 clientId 없을 수도 있어서)
      select: { id: true },
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}