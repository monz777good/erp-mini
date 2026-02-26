import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * ✅ 로젠택배 엑셀(또는 데이터) 출력용
 * - 빌드 통과/운영 안전 버전
 * - OrderStatus enum에 없는 "SHIPPED" 사용 금지 → "DONE"으로 처리
 *
 * 기대 상태값:
 *   REQUESTED / APPROVED / REJECTED / DONE
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // 선택 다운로드면 orderIds 배열을 받음 (없으면 승인건 전체)
    const orderIds: string[] = Array.isArray(body?.orderIds) ? body.orderIds : [];

    // ✅ 1) 대상 주문 조회: 승인(APPROVED)만
    const orders = await prisma.order.findMany({
      where: orderIds.length
        ? { id: { in: orderIds }, status: "APPROVED" }
        : { status: "APPROVED" },
      include: {
        item: { select: { name: true } },
        user: { select: { name: true, phone: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // ✅ 2) 로젠 업로드용 "행 데이터" 만들기
    // (지금 단계는 빌드/서버 통과가 1순위라서, 파일 생성은 프론트/기존 로직에서 처리해도 됨)
    const rows = orders.map((o) => {
      // 프로젝트 필드명들(예: receiverPhone/receiverMobile/boxCount 등)은
      // 네 스키마에 맞춰 이미 있는 필드만 사용
      const receiverName = (o as any).receiverName ?? "";
      const receiverAddr = (o as any).receiverAddr ?? "";
      const receiverPhone = (o as any).receiverPhone ?? "";
      const receiverMobile = (o as any).receiverMobile ?? "";
      const boxCount = (o as any).boxCount ?? 1;
      const shipFee = 3850;

      return {
        // 로젠 샘플 기준: A1=Y, A2부터 값 시작 같은 구조는
        // 엑셀 생성 코드에서 헤더를 넣으면 되고,
        // 여기서는 "데이터 원본"만 내려줌
        y: "y",
        receiverName,
        receiverAddr,
        receiverPhone,
        receiverMobile,
        boxCount,
        shipFee,
        fareType: "선불",
        itemName: o.item?.name ?? "",
        message: (o as any).note ?? "",
        orderId: o.id,
      };
    });

    // ✅ 3) 상태 업데이트: SHIPPED 금지 → DONE으로 처리
    if (orders.length) {
      await prisma.order.updateMany({
        where: { id: { in: orders.map((o) => o.id) } },
        data: { status: "DONE" },
      });
    }

    return NextResponse.json({ ok: true, count: orders.length, rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}