// src/app/api/orders/export/logen/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const runtime = "nodejs"; // ✅ 엑셀/버퍼는 Node 런타임 고정

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function GET() {
  // ✅ 승인된 주문만 뽑는다고 가정 (너 기존 로직에 맞게 status만 바꿔도 됨)
  const orders = await prisma.order.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      item: true,
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("로젠");

  // ✅ 너가 확정한 컬럼 배치 기준 (A=Y, B=수하인명, C=주소, D=전화, E=핸드폰, F=박스, G=택배운임/요금, H=운임구분, I=품목, J(비움), K=배송메세지)
  // 1행은 헤더가 아니라 "y"가 들어가는 샘플 포맷이라고 했으니, 아래처럼 데이터부터 넣음.
  // 필요하면 헤더 넣고 싶을 때만 따로 추가하면 됨.

  // ✅ A1에 y가 들어가야 한다면, 첫 행을 강제로 한 번 만들어둠
  // (너가 말한 "A1이 Y, A2부터 데이터"를 정확히 맞춤)
  ws.getCell("A1").value = "y";

  let rowIndex = 2; // A2부터 데이터

  for (const o of orders) {
    const receiverName = (o as any).receiverName ?? "";
    const receiverAddr =
      (o as any).receiverAddr ?? (o as any).address ?? ""; // ✅ 여기서 address 쓰면 안 됨(타입 때문에). receiverAddr가 정답.
    const tel = digitsOnly((o as any).receiverPhone ?? (o as any).phone ?? "");
    const mobile = digitsOnly(
      (o as any).receiverMobile ?? (o as any).mobile ?? (o as any).phone ?? ""
    );

    const boxQty = (o as any).boxQty ?? (o as any).quantity ?? 1; // 너 DB가 boxQty 없으면 quantity로 대체
    const shipFee = 3850; // 택배운임(요금)

    const fareType = (o as any).fareType ?? ""; // 운임구분(없으면 빈칸)
    const itemName = o.item?.name ?? "";
    const msg = (o as any).deliveryMsg ?? (o as any).note ?? ""; // 배송메세지(없으면 note)

    // A~K (J는 비움)
    ws.getCell(`A${rowIndex}`).value = "y"; // A
    ws.getCell(`B${rowIndex}`).value = receiverName; // B 수하인명
    ws.getCell(`C${rowIndex}`).value = receiverAddr; // C 수하인주소
    ws.getCell(`D${rowIndex}`).value = tel; // D 수하인전화번호
    ws.getCell(`E${rowIndex}`).value = mobile; // E 수하인핸드폰번호
    ws.getCell(`F${rowIndex}`).value = Number(boxQty) || 1; // F 박스수량
    ws.getCell(`G${rowIndex}`).value = shipFee; // G 택배운임/요금
    ws.getCell(`H${rowIndex}`).value = fareType; // H 운임구분
    ws.getCell(`I${rowIndex}`).value = itemName; // I 품목
    // J 비움
    ws.getCell(`K${rowIndex}`).value = msg; // K 배송메세지

    rowIndex++;
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="logen.xlsx"`,
    },
  });
}