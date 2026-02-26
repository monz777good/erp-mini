import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";

const SHIPPING_FEE = 3850;
const DEFAULT_BOX = 1;
const DEFAULT_FREIGHT_TYPE = "선불";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  // ✅ 승인건만 로젠 출력 (원하면 나중에 쿼리로 확장)
  const orders = await prisma.order.findMany({
    where: { status: OrderStatus.APPROVED },
    orderBy: { createdAt: "asc" },
    include: {
      item: { select: { name: true } },
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("rozen");

  // ✅ 로젠 최신 양식
  // A: Y / B: 수하인명 / C: 수하인주소 / D: 전화 / E: 핸드폰 / F: 박스수량 / G: 택배운임 / H: 운임구분 / I: 품목 / J(비움) / K: 배송메세지
  ws.getCell("A1").value = "Y";
  ws.getCell("B1").value = "수하인명";
  ws.getCell("C1").value = "수하인주소";
  ws.getCell("D1").value = "전화";
  ws.getCell("E1").value = "핸드폰";
  ws.getCell("F1").value = "박스수량";
  ws.getCell("G1").value = "택배운임";
  ws.getCell("H1").value = "운임구분";
  ws.getCell("I1").value = "품목";
  ws.getCell("J1").value = "";
  ws.getCell("K1").value = "배송메세지";

  let r = 2;

  for (const o of orders as any[]) {
    // ✅ 너 타입에 "receiverTel"이 있는 게 확인됨 -> 그걸 전화(D)에 넣음
    // ✅ 핸드폰(E)은 receiverMobile 있으면 쓰고, 없으면 receiverTel로 대체
    const tel = digitsOnly(o.receiverTel);
    const mobile = digitsOnly(o.receiverMobile ?? o.receiverTel);

    ws.getCell(`A${r}`).value = "y";
    ws.getCell(`B${r}`).value = o.receiverName ?? "";
    ws.getCell(`C${r}`).value = o.receiverAddr ?? "";
    ws.getCell(`D${r}`).value = tel;
    ws.getCell(`E${r}`).value = mobile;
    ws.getCell(`F${r}`).value = Number(o.boxCount ?? DEFAULT_BOX);
    ws.getCell(`G${r}`).value = Number(o.deliveryFee ?? SHIPPING_FEE);
    ws.getCell(`H${r}`).value = o.freightType ?? DEFAULT_FREIGHT_TYPE;
    ws.getCell(`I${r}`).value = o.item?.name ?? "";
    ws.getCell(`K${r}`).value = o.deliveryMsg ?? o.note ?? "";

    r++;
  }

  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(buf as any, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rozen.xlsx"`,
    },
  });
}