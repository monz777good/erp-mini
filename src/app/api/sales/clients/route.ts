import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {

  try {

    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { ok: false },
        { status: 401 }
      );
    }

    const form = await req.formData();

    const name = String(form.get("name") ?? "");
    const ownerName = String(form.get("ownerName") ?? "");
    const bizRegNo = String(form.get("bizRegNo") ?? "");
    const careInstitutionNo = String(form.get("careInstitutionNo") ?? "");

    const receiverName = String(form.get("receiverName") ?? "");
    const receiverAddr = String(form.get("receiverAddr") ?? "");
    const receiverTel = String(form.get("receiverTel") ?? "");
    const receiverMobile = String(form.get("receiverMobile") ?? "");

    const memo = String(form.get("memo") ?? "");

    const file = form.get("file") as File | null;

    let bizFileUrl: string | null = null;
    let bizFileName: string | null = null;

    if (file) {

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fs = require("fs");

      const dir = "./public/uploads";

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const path = `uploads/${Date.now()}_${file.name}`;
      const full = `./public/${path}`;

      fs.writeFileSync(full, buffer);

      bizFileUrl = "/" + path;
      bizFileName = file.name;
    }

    const client = await prisma.client.create({
      data: {
        name,
        ownerName,
        bizRegNo,
        careInstitutionNo,

        receiverName,
        receiverAddr,
        receiverTel,
        receiverMobile,

        memo,

        bizFileUrl,
        bizFileName,

        userId: user.id
      }
    });

    return NextResponse.json({
      ok: true,
      client
    });

  } catch (e: any) {

    return NextResponse.json(
      {
        ok: false,
        error: String(e)
      },
      { status: 500 }
    );

  }

}