import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

async function requireUser(req: Request) {
  const user = await getSessionUser(req as any);
  return user ?? null;
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const clientId = body?.clientId ? String(body.clientId) : null;
  const receiverName = String(body?.receiverName ?? "").trim();
  const receiverAddr = String(body?.receiverAddr ?? "").trim();
  const mobile = digitsOnly(body?.mobile ?? "");
  const phone = digitsOnly(body?.phone ?? "");
  const message = String(body?.message ?? "").trim() || null;

  const lines = Array.isArray(body?.lines) ? body.lines : [];

  if (!receiverName || !receiverAddr || !mobile) {
    return NextResponse.json(
      { ok: false, message: "RECEIVER_REQUIRED" },
      { status: 400 }
    );
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ ok: false, message: "EMPTY_LINES" }, { status: 400 });
  }

  // 라인 검증
  const normalized = lines.map((l: any) => ({
    itemId: String(l?.itemId ?? ""),
    quantity: Number(l?.quantity ?? 0),
    note: String(l?.note ?? "").trim() || null,
  }));

  if (normalized.some((l) => !l.itemId || !Number.isFinite(l.quantity) || l.quantity <= 0)) {
    return NextResponse.json({ ok: false, message: "BAD_LINES" }, { status: 400 });
  }

  // ✅ 트랜잭션으로 한 번에 생성
  const created = await prisma.$transaction(async (tx) => {
    // (선택) clientId가 있으면 내 거래처인지 확인
    if (clientId) {
      const ok = await tx.client.findFirst({
        where: { id: clientId, ownerUserId: user.id },
        select: { id: true },
      });
      if (!ok) throw new Error("CLIENT_FORBIDDEN");
    }

    const orders = await Promise.all(
      normalized.map((l) =>
        tx.order.create({
          data: {
            userId: user.id,
            itemId: l.itemId,
            quantity: l.quantity,
            status: "REQUESTED",
            note: l.note,
            message,
            receiverName,
            receiverAddr,
            mobile,
            phone: phone || null,
            clientId,
          },
          select: { id: true },
        })
      )
    );

    return orders;
  }).catch((e: any) => {
    const msg = String(e?.message ?? e);
    if (msg.includes("CLIENT_FORBIDDEN")) {
      return null;
    }
    throw e;
  });

  if (!created) {
    return NextResponse.json({ ok: false, message: "CLIENT_FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, createdCount: created.length });
}