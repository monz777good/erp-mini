import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

function toStartOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}
function toEndOfDay(dateStr: string) {
  return new Date(`${dateStr}T23:59:59.999`);
}

function fmtKR(d: any) {
  try {
    return new Date(d).toLocaleString("ko-KR");
  } catch {
    return String(d ?? "");
  }
}

const STATUS_KR: Record<string, string> = {
  REQUESTED: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
  DONE: "출고완료",
};

function krStatus(s: any) {
  const key = String(s ?? "").toUpperCase();
  return STATUS_KR[key] ?? key;
}

// 스타일 helpers
function setAllBorders(row: ExcelJS.Row) {
  row.eachCell((c) => {
    c.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

function fillRow(row: ExcelJS.Row, argb: string) {
  row.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
  });
}

function alignRow(row: ExcelJS.Row, vertical: "middle" | "top" = "middle") {
  row.eachCell((c) => {
    c.alignment = { vertical, horizontal: "center", wrapText: true };
  });
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, message: "관리자만" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = String(searchParams.get("from") ?? "").trim();
  const to = String(searchParams.get("to") ?? "").trim();

  if (!from || !to) {
    return NextResponse.json({ ok: false, message: "from/to(YYYY-MM-DD)가 필요합니다." }, { status: 400 });
  }

  const range = {
    createdAt: {
      gte: toStartOfDay(from),
      lte: toEndOfDay(to),
    },
  };

  const whereApprovedInRange = { status: "APPROVED" as const, ...range };
  const whereApprovedAll = { status: "APPROVED" as const };

  const orders = await prisma.order.findMany({
    where: whereApprovedInRange,
    orderBy: { createdAt: "asc" },
    include: {
      item: { select: { name: true } },
      user: { select: { name: true, phone: true } },
    },
  });

  const approvedCountInRange = await prisma.order.count({ where: whereApprovedInRange });
  const approvedCountAll = await prisma.order.count({ where: whereApprovedAll });

  const grouped = await prisma.order.groupBy({
    by: ["itemId"],
    where: whereApprovedInRange,
    _sum: { quantity: true },
    _count: { _all: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 20,
  });

  const itemIds = grouped.map((g) => g.itemId);
  const items = itemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, name: true },
      })
    : [];

  const idToName = new Map(items.map((it) => [it.id, it.name]));
  const topItems = grouped.map((g, idx) => ({
    rank: idx + 1,
    itemName: idToName.get(g.itemId) ?? "(삭제된 품목)",
    totalQty: Number(g._sum.quantity ?? 0),
    orderCount: Number(g._count._all ?? 0),
  }));

  const wb = new ExcelJS.Workbook();
  wb.creator = "ERP Mini";
  wb.created = new Date();

  const ws = wb.addWorksheet("승인주문", {
    views: [{ state: "frozen", ySplit: 12 }], // ✅ 위쪽 고정(헤더까지)
  });

  // 기본 폰트
  ws.properties.defaultRowHeight = 18;

  // ✅ 컬럼 폭(보기 좋게)
  ws.columns = [
    { width: 20 }, // A 주문일시
    { width: 18 }, // B 품목
    { width: 8 },  // C 수량
    { width: 14 }, // D 수하인
    { width: 30 }, // E 주소
    { width: 16 }, // F 핸드폰
    { width: 16 }, // G 전화
    { width: 22 }, // H 요청메모
    { width: 14 }, // I 요청자(영업)
    { width: 16 }, // J 요청자폰
    { width: 12 }, // K 상태
  ];

  // -------------------------
  // ✅ 타이틀 바
  // -------------------------
  ws.addRow([`승인 주문 리포트  (${from} ~ ${to})`]);
  ws.mergeCells("A1:K1");
  const titleRow = ws.getRow(1);
  titleRow.height = 26;
  titleRow.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titleRow.alignment = { vertical: "middle", horizontal: "center" };
  titleRow.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } }; // 다크
  });

  ws.addRow([]);

  // -------------------------
  // ✅ 요약 섹션
  // -------------------------
  ws.addRow(["요약"]);
  ws.mergeCells("A3:K3");
  const sec1 = ws.getRow(3);
  sec1.height = 20;
  sec1.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  sec1.alignment = { vertical: "middle", horizontal: "left" };
  sec1.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } }));

  ws.addRow(["기간 내 승인 건수", approvedCountInRange]);
  ws.addRow(["전체 누적 승인 건수", approvedCountAll]);

  // 꾸미기(요약 라인)
  for (const r of [4, 5]) {
    const row = ws.getRow(r);
    row.height = 18;
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
    row.getCell(2).font = { bold: true };
    row.getCell(2).numFmt = "0";
    setAllBorders(row);
  }

  ws.addRow([]);

  // -------------------------
  // ✅ 품목 TOP 섹션
  // -------------------------
  ws.addRow(["품목별 출고 TOP (기간 내 승인 기준, 수량합)"]);
  ws.mergeCells("A7:K7");
  const sec2 = ws.getRow(7);
  sec2.height = 20;
  sec2.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  sec2.alignment = { vertical: "middle", horizontal: "left" };
  sec2.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } }));

  // TOP 테이블 (A~D만 사용)
  ws.addRow(["순위", "품목", "총수량", "건수"]);
  const topHead = ws.getRow(8);
  topHead.font = { bold: true };
  topHead.height = 18;
  fillRow(topHead, "FFF3F4F6"); // 연회색
  setAllBorders(topHead);
  alignRow(topHead);

  if (topItems.length === 0) {
    ws.addRow([1, "데이터 없음", 0, 0]);
  } else {
    for (const t of topItems) {
      ws.addRow([t.rank, t.itemName, t.totalQty, t.orderCount]);
    }
  }

  // TOP 테이블 테두리/정렬 (9행 ~)
  const topStart = 9;
  const topEnd = 8 + Math.max(1, topItems.length);
  for (let r = topStart; r <= topEnd; r++) {
    const row = ws.getRow(r);
    row.height = 18;
    // A-D만 테두리
    for (let c = 1; c <= 4; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: c === 2 ? "left" : "center", wrapText: true };
    }
    row.getCell(3).numFmt = "0";
    row.getCell(4).numFmt = "0";
  }

  ws.addRow([]);

  // -------------------------
  // ✅ 승인 주문 목록 섹션
  // -------------------------
  ws.addRow(["승인 주문 목록"]);
  ws.mergeCells("A12:K12");
  const sec3 = ws.getRow(12);
  sec3.height = 20;
  sec3.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  sec3.alignment = { vertical: "middle", horizontal: "left" };
  sec3.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } }));

  ws.addRow([
    "주문일시",
    "품목",
    "수량",
    "수하인",
    "주소",
    "핸드폰",
    "전화",
    "요청메모",
    "요청자(영업)",
    "요청자폰",
    "상태",
  ]);

  const head = ws.getRow(13);
  head.font = { bold: true };
  head.height = 20;
  fillRow(head, "FFE5E7EB"); // 조금 진한 회색
  setAllBorders(head);
  alignRow(head);

  // ✅ 본문 데이터
  for (const o of orders) {
    ws.addRow([
      fmtKR(o.createdAt),
      o.item?.name ?? "",
      o.quantity ?? 0,
      o.receiverName ?? "",
      o.receiverAddr ?? "",
      o.mobile ?? "",
      o.phone ?? "",
      o.message ?? o.note ?? "",
      o.user?.name ?? "",
      o.user?.phone ?? "",
      krStatus(o.status), // ✅ 상태 한글
    ]);
  }

  // 본문 스타일 + 테두리 + 숫자포맷
  const bodyStart = 14;
  const bodyEnd = 13 + Math.max(1, orders.length);
  for (let r = bodyStart; r <= bodyEnd; r++) {
    const row = ws.getRow(r);
    row.height = 18;

    // 테두리
    row.eachCell((c) => {
      c.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });

    // 주소/메모는 왼쪽 정렬
    row.getCell(5).alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    row.getCell(8).alignment = { vertical: "middle", horizontal: "left", wrapText: true };

    // 수량 숫자
    row.getCell(3).numFmt = "0";
  }

  // ✅ 자동필터(목록 헤더 행)
  ws.autoFilter = {
    from: { row: 13, column: 1 },
    to: { row: 13, column: 11 },
  };

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="approved_${from}_${to}.xlsx"`,
    },
  });
}
