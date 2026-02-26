export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDateRange(from?: string | null, to?: string | null) {
  const f = from ? new Date(`${from}T00:00:00`) : null;
  const t = to ? new Date(`${to}T23:59:59.999`) : null;
  return { f, t };
}

// 기본값
const LOZEN_FEE = 3850;
const DEFAULT_FREIGHT_TYPE = "선불";

export async function GET(req: Request) {
  // ✅ 관리자만 허용 (원하면 여기 풀어줄 수 있음)
  const user = await getSessionUser(req as any);
  if (!user || String((user as any).role).toUpperCase() !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "ADMIN_ONLY" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = (url.searchParams.get("status") || "APPROVED").toUpperCase();

  const { f, t } = toDateRange(from, to);

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (f || t) {
    where.createdAt = {};
    if (f) where.createdAt.gte = f;
    if (t) where.createdAt.lte = t;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { item: { select: { name: true } } },
  });

  // ✅ 템플릿은 public에서 읽는다 (Next에서 제일 안전)
  const templateCandidates = [
    path.join(process.cwd(), "public", "lozen_template.xls"),
    path.join(process.cwd(), "public", "lozen_template.xlsx"),
  ];

  const templatePath = templateCandidates.find((p) => fs.existsSync(p));
  if (!templatePath) {
    return NextResponse.json(
      {
        ok: false,
        message: "TEMPLATE_NOT_FOUND",
        needOneOf: templateCandidates,
        tip: "public/lozen_template.xls (또는 .xlsx) 파일을 넣어야 함",
      },
      { status: 500 }
    );
  }

  const templateBuf = fs.readFileSync(templatePath);
  const wb = XLSX.read(templateBuf, { type: "buffer" });

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // ✅ 기존 데이터 영역 삭제(A2~K9999)
  const clearFromRow = 2;
  const clearToRow = 9999;
  const cols = ["A","B","C","D","E","F","G","H","I","J","K"];
  for (let r = clearFromRow; r <= clearToRow; r++) {
    for (const c of cols) {
      const addr = `${c}${r}`;
      if (ws[addr]) ws[addr].v = "";
    }
  }

  // ✅ 너가 요구한 위치 고정 (B,J 비움)
  // A=이름, C=주소, D=전화, E=핸드폰, F=박스, G=택배운임, H=운임구분, I=품목, K=배송메세지
  const rows: any[][] = orders.map((o: any) => {
    const receiverName = String(o.receiverName ?? "").trim();
    const receiverAddr = String(o.receiverAddr ?? "").trim();

    const phone = digitsOnly(o.phone ?? o.receiverPhone ?? "");
    const mobile = digitsOnly(o.mobile ?? o.receiverMobile ?? "");

    const boxQty = Number.isFinite(o.boxQty) ? Number(o.boxQty) : 1;
    const fee = Number.isFinite(o.fee) ? Number(o.fee) : LOZEN_FEE;
    const freightType = String(o.freightType ?? DEFAULT_FREIGHT_TYPE);

    const itemName = String(o.item?.name ?? "").trim();
    const msg = String(o.message ?? o.deliveryMessage ?? o.note ?? "").trim();

    return [
      receiverName,  // A
      "",            // B (비움)
      receiverAddr,  // C
      phone,         // D
      mobile,        // E
      boxQty,        // F
      fee,           // G (택배운임)
      freightType,   // H
      itemName,      // I
      "",            // J (비움)
      msg,           // K
    ];
  });

  XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A2" });

  const outBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const safeFrom = from || ymd(new Date());
  const safeTo = to || ymd(new Date());
  const filename = `lozen_${safeFrom}_${safeTo}_${status}.xlsx`;

  return new NextResponse(outBuf as any, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}