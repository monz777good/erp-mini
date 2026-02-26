import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}
function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}
async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

function setHeader(ws: ExcelJS.Worksheet) {
  // ✅ 헤더 위치 “셀로 강제 고정” (A1~K1)
  ws.getCell("A1").value = "y"; // A1
  ws.getCell("B1").value = ""; // B1 공백
  ws.getCell("C1").value = "수하인주소"; // C1
  ws.getCell("D1").value = "수하인전화번호"; // D1
  ws.getCell("E1").value = "수하인핸드폰번호"; // E1
  ws.getCell("F1").value = "박스수량"; // F1
  ws.getCell("G1").value = "택배운임"; // G1
  ws.getCell("H1").value = "택배운임"; // H1 (안씀)
  ws.getCell("I1").value = "품목명"; // I1
  ws.getCell("J1").value = ""; // J1 공백
  ws.getCell("K1").value = "배송메시지"; // K1

  // 보기 좋게(선택)
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  // 운임 표시 형식 (3,850처럼 보이게)
  ws.getColumn("G").numFmt = "#,##0";
}

function addDataRow(ws: ExcelJS.Worksheet, rowIndex: number, o: any) {
  const receiverName = String(o.receiverName ?? "");
  const receiverAddr = String(o.receiverAddr ?? "");

  // ✅ 너 말대로 번호는 하나만 적으니까 D/E 둘 다 동일 번호
  const phone = digitsOnly(o.phone) || digitsOnly(o.mobile) || "";
  const mobile = phone;

  const itemName = String(o.item?.name ?? "");
  const msg = String(o.message ?? "").trim();

  ws.getCell(`A${rowIndex}`).value = receiverName; // 수하인(이름)
  ws.getCell(`B${rowIndex}`).value = ""; // 공백
  ws.getCell(`C${rowIndex}`).value = receiverAddr; // 주소
  ws.getCell(`D${rowIndex}`).value = phone; // 전화
  ws.getCell(`E${rowIndex}`).value = mobile; // 핸드폰
  ws.getCell(`F${rowIndex}`).value = 1; // ✅ 박스수량 1 고정
  ws.getCell(`G${rowIndex}`).value = 3850; // ✅ 택배운임 3,850 고정
  ws.getCell(`H${rowIndex}`).value = ""; // ✅ 안씀(공백 유지)
  ws.getCell(`I${rowIndex}`).value = itemName; // 품목명
  ws.getCell(`J${rowIndex}`).value = ""; // 공백 유지
  ws.getCell(`K${rowIndex}`).value = msg ? msg : ""; // 배송메시지(있을 때만)
}

async function buildWorkbook(orders: any[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("로젠");

  setHeader(ws);

  // ✅ 데이터는 2행부터
  let r = 2;
  for (const o of orders) {
    addDataRow(ws, r, o);
    r += 1;
  }

  ws.columns = [
    { width: 16 }, // A
    { width: 6 },  // B
    { width: 44 }, // C
    { width: 18 }, // D
    { width: 18 }, // E
    { width: 10 }, // F
    { width: 12 }, // G
    { width: 12 }, // H
    { width: 26 }, // I
    { width: 6 },  // J
    { width: 26 }, // K
  ];

  return wb;
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "관리자만" }, { status: 403 });

  // ✅ 승인건만 뽑기
  const orders = await prisma.order.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    include: { item: { select: { name: true } } },
  });

  // ✅ 승인건 없으면 “빈 엑셀” 주지 말고 에러로 알려줌
  if (orders.length === 0) {
    return NextResponse.json(
      { message: "승인(APPROVED)된 주문이 없습니다. (로젠 출력하면 자동으로 출고완료(DONE)로 바뀜)" },
      { status: 400 }
    );
  }

  const wb = await buildWorkbook(orders);
  const buffer = await wb.xlsx.writeBuffer();

  // ✅ 로젠 출력 후 DONE 처리
  await prisma.order.updateMany({
    where: { id: { in: orders.map((o) => o.id) }, status: "APPROVED" },
    data: { status: "DONE" },
  });

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rozen.xlsx"`,
    },
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "관리자만" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ message: "ids 비었음" }, { status: 400 });

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "asc" },
    include: { item: { select: { name: true } } },
  });

  if (orders.length === 0) {
    return NextResponse.json({ message: "선택된 주문이 없습니다." }, { status: 400 });
  }

  const wb = await buildWorkbook(orders);
  const buffer = await wb.xlsx.writeBuffer();

  // ✅ 선택 출력도 DONE 처리(현재 APPROVED인 것만)
  await prisma.order.updateMany({
    where: { id: { in: orders.map((o) => o.id) }, status: "APPROVED" },
    data: { status: "DONE" },
  });

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rozen_selected.xlsx"`,
    },
  });
}
