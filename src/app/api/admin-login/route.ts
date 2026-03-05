import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body =await req.json().catch(() => ({} as any));
    const phone = digitsOnly(body.phone ?? "");
    const pin = String(body.pin ?? "");
    const name = String(body.name ?? "").trim();

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { ok: false, error: "PHONE_REQUIRED" },
        { status: 400 }
      );
    }
    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { ok: false, error: "PIN_REQUIRED" },
        { status: 400 }
      );
    }

    const pepper = process.env.PIN_PEPPER ?? "";
    const pinHash = sha256Hex(`{pin}:{pepper}`);

    //    (  1 )
    let user =await prisma.user.findFirst({
      where: { phone, role: "ADMIN" },
    });

    if (!user) {
      //   : name   
      if (!name) {
        return NextResponse.json(
          { ok: false, error: "NAME_REQUIRED" },
          { status: 400 }
        );
      }
      user =await prisma.user.create({
        data: {
          name,
          phone,
          role: "ADMIN",
          pin: pinHash,
        },
      });
    } else {
      //   PIN 
      if (!user.pin || user.pin !== pinHash) {
        return NextResponse.json(
          { ok: false, error: "INVALID_PIN" },
          { status: 401 }
        );
      }
    }

    //  : res  . setSessionUser(user) 
await setSessionUser({ id: user.id, name: user.name, role: user.role as any });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}