import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

function money(n: number) {
  return (n ?? 0).toLocaleString("ko-KR");
}
function Y(H: number, yTop: number) {
  return H - yTop;
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: "FORBIDDEN" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const clientId = String(searchParams.get("clientId") ?? "").trim();
  const from = String(searchParams.get("from") ?? "").trim();
  const to = String(searchParams.get("to") ?? "").trim();

  if (!clientId) return NextResponse.json({ message: "clientId 필요" }, { status: 400 });
  if (!from || !to) return NextResponse.json({ message: "from/to 필요" }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ message: "거래처 없음" }, { status: 404 });

  const orders = await prisma.order.findMany({
    where: {
      clientId,
      createdAt: {
        gte: new Date(from + "T00:00:00"),
        lte: new Date(to + "T23:59:59"),
      },
      status: { in: ["REQUESTED", "APPROVED", "DONE"] },
    },
    orderBy: { createdAt: "asc" },
    include: { item: { select: { name: true, price: true } } },
  });

  const imgPath = path.join(process.cwd(), "public", "templates", "statement.png");
  if (!fs.existsSync(imgPath)) {
    return NextResponse.json({ message: "템플릿 없음: public/templates/statement.png" }, { status: 500 });
  }

  const imgBytes = fs.readFileSync(imgPath);

  // (너 이미지가 763x558 기준)
  const W = 763;
  const H = 558;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([W, H]);
  const png = await pdf.embedPng(imgBytes);
  page.drawImage(png, { x: 0, y: 0, width: W, height: H });

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const black = rgb(0, 0, 0);

  // 날짜/번호(원하면 번호도 파라미터로 확장 가능)
  page.drawText(from.replaceAll("-", "/"), { x: 75, y: Y(H, 55), size: 10, font, color: black });
  page.drawText("011", { x: 205, y: Y(H, 55), size: 10, font, color: black });

  // 거래처
  page.drawText(String(client.bizNo ?? ""), { x: 470, y: Y(H, 72), size: 9, font, color: black });
  page.drawText(String(client.name ?? ""), { x: 600, y: Y(H, 95), size: 10, font, color: black });
  page.drawText(String(client.tel ?? ""), { x: 705, y: Y(H, 72), size: 9, font, color: black });
  page.drawText(String(client.addr ?? ""), { x: 470, y: Y(H, 135), size: 8.5, font, color: black });

  // 품목 라인
  const startTop = 205;
  const rowH = 22;

  let total = 0;
  orders.slice(0, 10).forEach((o, idx) => {
    const yTop = startTop + idx * rowH;
    const qty = Number(o.quantity ?? 0);
    const unit = Number(o.item?.price ?? 0);
    const amt = qty * unit;
    total += amt;

    page.drawText(String(idx + 1), { x: 12, y: Y(H, yTop), size: 9, font, color: black });
    page.drawText(String(o.item?.name ?? ""), { x: 150, y: Y(H, yTop), size: 9, font, color: black });
    page.drawText(String(qty), { x: 430, y: Y(H, yTop), size: 9, font, color: black });
    page.drawText(money(unit), { x: 485, y: Y(H, yTop), size: 9, font, color: black });
    page.drawText(money(amt), { x: 560, y: Y(H, yTop), size: 9, font, color: black });
  });

  const supply = Math.round(total / 1.1);
  const vat = total - supply;

  page.drawText(money(total), { x: 665, y: Y(H, 452), size: 10, font, color: black }); // 소계
  page.drawText(money(supply), { x: 665, y: Y(H, 475), size: 10, font, color: black }); // 공급가액
  page.drawText(money(vat), { x: 665, y: Y(H, 498), size: 10, font, color: black }); // 세액
  page.drawText(money(total), { x: 665, y: Y(H, 521), size: 10, font, color: black }); // 합계

  const bytes = await pdf.save();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="statement_${from}_${to}.pdf"`,
    },
  });
}
