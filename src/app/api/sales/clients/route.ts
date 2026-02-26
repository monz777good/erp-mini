import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import path from "path";
import fs from "fs/promises";

async function requireUser(req: Request) {
  const user = await getSessionUser(req as any);
  return user ?? null;
}

function safeName(name: string) {
  return name.replace(/[^\w.\-가-힣]/g, "_");
}

function digitsOnly(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  // ✅ 영업사원 화면에서는 무조건 "내 거래처만"
  const clients = await prisma.client.findMany({
    where: { ownerUserId: user.id },
    orderBy: { createdAt: "desc" },
    // ✅ 영업사원에게 bizCertPath 굳이 안 내려줌(관리자만 열람)
    select: {
      id: true,
      name: true,
      bizNo: true,
      addr: true,
      tel: true,
      careNo: true,
      email: true,
      remark: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, clients });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, message: "INVALID_FORMDATA" }, { status: 400 });

  const name = String(form.get("name") ?? "").trim();
  const bizNo = String(form.get("bizNo") ?? "").trim() || null;
  const addr = String(form.get("addr") ?? "").trim() || null;
  const tel = String(form.get("tel") ?? "").trim() || null;

  // ✅ 추가 3개
  const careNoRaw = String(form.get("careNo") ?? "").trim();
  const careNo = careNoRaw ? digitsOnly(careNoRaw) : null;

  const email = String(form.get("email") ?? "").trim() || null;
  const remark = String(form.get("remark") ?? "").trim() || null;

  if (!name) return NextResponse.json({ ok: false, message: "NAME_REQUIRED" }, { status: 400 });

  // ✅ 요양기관번호는 "입력했을 때만" 8자리 숫자 강제
  if (careNo && careNo.length !== 8) {
    return NextResponse.json({ ok: false, message: "CARENO_MUST_BE_8_DIGITS" }, { status: 400 });
  }

  // ✅ 같은 영업사원(ownerUserId) 안에서만 중복 방지
  const exists = await prisma.client.findFirst({
    where: { ownerUserId: user.id, name },
    select: { id: true },
  });
  if (exists) return NextResponse.json({ ok: false, message: "DUPLICATE_CLIENT_NAME" }, { status: 400 });

  // ✅ 파일 저장(선택)
  let bizCertPath: string | null = null;
  const file = form.get("bizCert");
  if (file && typeof file !== "string") {
    const f = file as File;
    if (f.size > 0) {
      const bytes = Buffer.from(await f.arrayBuffer());
      const dir = path.join(process.cwd(), "public", "uploads", "bizcerts");
      await fs.mkdir(dir, { recursive: true });

      const filename = `${Date.now()}_${safeName(f.name || "bizcert")}`;
      const abs = path.join(dir, filename);
      await fs.writeFile(abs, bytes);

      bizCertPath = `/uploads/bizcerts/${filename}`;
    }
  }

  const created = await prisma.client.create({
    data: {
      ownerUserId: user.id,
      name,
      bizNo,
      addr,
      tel,
      careNo,
      email,
      remark,
      bizCertPath,
    },
    select: {
      id: true,
      name: true,
      bizNo: true,
      addr: true,
      tel: true,
      careNo: true,
      email: true,
      remark: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, client: created });
}