import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import ExcelJS from "exceljs";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin((user as any).role)) return null;
  return user as any;
}

function digitsOnly(v?: string | null) {
  return String(v ?? "").replace(/\D/g, "");
}

// ✅ POST /api/admin/orders/rozen
// body: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
// 결과: 엑셀 다운로드 + (포함된 APPROVED 주문들) => DONE 으로 자동 변경
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const from = String(body?.from || "").trim(); // YYYY-MM-DD
  const to = String(body?.to || "").trim();     // YYYY-MM-DD

  const where: any = { status: "APPROVED" };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999`);
  }

  // ✅ 1) 승인건 가져오기
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { item: { select: { name: true } } },
  });

  // ✅ 승인건이 없으면 파일 대신 에러로 알려주기
  if (orders.length === 0) {
    return NextResponse.json(
      { message: "해당 기간의 승인(APPROVED) 주문이 없습니다." },
      { status: 400 }
    );
  }

  // ✅ 2) 엑셀 생성
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rogen");

  // A: y / B: 수하인명 / C: 수하인주소 / D: 전화 / E: 핸드폰 / F: 박스수량
  // G: 택배운임 / H: 운임구분 / I: 품목 / J: (비움) / K: 배송메세지
  ws.getCell("A1").value = "y";
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

  ws.columns = [
    { key: "A", width: 4 },
    { key: "B", width: 14 },
    { key: "C", width: 40 },
    { key: "D", width: 14 },
    { key: "E", width: 14 },
    { key: "F", width: 10 },
    { key: "G", width: 12 },
    { key: "H", width: 10 },
    { key: "I", width: 24 },
    { key: "J", width: 8 },
    { key: "K", width: 24 },
  ];

  const SHIPPING_FEE = 3850;
  const DEFAULT_BOX = 1;
  const DEFAULT_PAY_TYPE = "선불";

  let r = 2;
  for (const o of orders) {
    ws.getCell(`A${r}`).value = "y";
    ws.getCell(`B${r}`).value = o.receiverName || "";
    ws.getCell(`C${r}`).value = o.receiverAddr || "";
    ws.getCell(`D${r}`).value = digitsOnly(o.phone);
    ws.getCell(`E${r}`).value = digitsOnly(o.mobile);
    ws.getCell(`F${r}`).value = DEFAULT_BOX;
    ws.getCell(`G${r}`).value = SHIPPING_FEE;
    ws.getCell(`H${r}`).value = DEFAULT_PAY_TYPE;
    ws.getCell(`I${r}`).value = o.item?.name || "";
    ws.getCell(`K${r}`).value = (o.message || o.note || "").toString();
    r++;
  }

  const buf = await wb.xlsx.writeBuffer();

  // ✅ 3) 다운로드 직후 => DONE으로 변경 (엑셀에 담긴 것만)
  // 안전하게 order.id들로 updateMany
  const ids = orders.map((o) => o.id);

  await prisma.order.updateMany({
    where: { id: { in: ids }, status: "APPROVED" },
    data: { status: "DONE" },
  });

  const fileName = `rogen_approved_${from || "all"}_${to || "all"}.xlsx`;

  return new NextResponse(buf as any, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}