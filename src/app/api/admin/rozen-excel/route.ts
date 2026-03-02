import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalStart(v: string) {
  return new Date(`${v}T00:00:00.000`);
}

function parseDateParam(v: string | null, fallback: Date) {
  if (!v) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return parseLocalStart(v);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return fallback;
  return d;
}

function digitsOnly(s: string | null | undefined) {
  return String(s ?? "").replace(/[^\d]/g, "");
}

export async function GET(req: Request) {
  try {
    // ✅ 핵심: req를 넘겨서 인증
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const today = new Date();
    const fromDate = parseDateParam(fromStr, parseLocalStart(ymd(today)));
    const toDate = parseDateParam(toStr, parseLocalStart(ymd(today)));

    const toNext = new Date(toDate);
    toNext.setDate(toNext.getDate() + 1);

    // ===============================
    // 1️⃣ 승인 주문 조회
    // ===============================
    const approvedOrders = await prisma.order.findMany({
      where: {
        status: "APPROVED",
        createdAt: { gte: fromDate, lt: toNext },
      },
      include: { item: true },
      orderBy: { createdAt: "asc" },
    });

    // ===============================
    // 2️⃣ 엑셀 생성 (헤더 절대 수정 X)
    // ===============================
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("로젠");

    ws.getCell("A1").value = "y";
    ws.getCell("C1").value = "수하인주소";
    ws.getCell("D1").value = "수하인전화번호";
    ws.getCell("E1").value = "수하인핸드폰번호";
    ws.getCell("F1").value = "박스수량";
    ws.getCell("G1").value = "택배운임";
    ws.getCell("H1").value = "운임구분";
    ws.getCell("I1").value = "품목명";
    ws.getCell("K1").value = "배송메세지";

    let row = 2;
    for (const o of approvedOrders) {
      ws.getCell(`A${row}`).value = (o as any).receiverName ?? "";
      ws.getCell(`C${row}`).value = (o as any).receiverAddr ?? "";
      ws.getCell(`D${row}`).value = digitsOnly((o as any).phone);
      ws.getCell(`E${row}`).value = digitsOnly((o as any).mobile);
      ws.getCell(`F${row}`).value = 1;
      ws.getCell(`G${row}`).value = 3850;
      ws.getCell(`H${row}`).value = "";
      ws.getCell(`I${row}`).value = (o as any).item?.name ?? "";
      ws.getCell(`K${row}`).value = (o as any).message ?? "";
      row++;
    }

    // ===============================
    // 3️⃣ 재고차감 + DONE 처리 (실패해도 엑셀은 내려보냄)
    // ===============================
    let shipError: string | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        const orders = await tx.order.findMany({
          where: {
            status: "APPROVED",
            createdAt: { gte: fromDate, lt: toNext },
          },
          include: { item: true },
        });

        const deductMap = new Map<string, number>();

        for (const o of orders) {
          const packV = (o.item as any)?.packV ?? 0;
          if (!packV) throw new Error(`묶음V 없음: ${o.item?.name}`);
          const deductV = o.quantity * packV;
          deductMap.set(o.itemId, (deductMap.get(o.itemId) ?? 0) + deductV);
        }

        for (const [itemId, deductV] of deductMap.entries()) {
          const item = await tx.item.findUnique({ where: { id: itemId } });
          const stockV = (item as any)?.stockV ?? 0;
          if (stockV < deductV) {
            throw new Error(
              `재고 부족: ${(item as any)?.name ?? itemId} (보유 ${stockV} / 필요 ${deductV})`
            );
          }
        }

        for (const [itemId, deductV] of deductMap.entries()) {
          await tx.item.update({
            where: { id: itemId },
            data: {
              // @ts-ignore
              stockV: { decrement: deductV },
            },
          });
        }

        await tx.order.updateMany({
          where: {
            status: "APPROVED",
            createdAt: { gte: fromDate, lt: toNext },
          },
          data: { status: "DONE" },
        });
      });
    } catch (e: any) {
      shipError = e?.message ?? String(e);
      console.error("출고 실패 (재고부족 등):", shipError);
    }

    // ===============================
    // 4️⃣ 엑셀 다운로드 (무조건)
    // ===============================
    const buf = await wb.xlsx.writeBuffer();
    const postfix = shipError ? "_재고부족" : "";

    return new NextResponse(buf as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rozen_${fromStr ?? ymd(today)}_${toStr ?? ymd(today)}${postfix}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (msg.startsWith("FORBIDDEN")) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}