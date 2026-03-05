import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 *  :  /  " " (import)
 *  :  Prisma User  loginPinHash  
 *              .
 *         =>   loginPinHash     .
 *
 *  (JSON)
 * {
 *   "users": [
 *     { "name": "", "phone": "01012345678", "role": "SALES" },
 *     { "name": "", "phone": "01099999999", "role": "ADMIN" }
 *   ]
 * }
 */

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function normalizeRole(role: any): "SALES" | "ADMIN" {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" ? "ADMIN" : "SALES";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const list = Array.isArray(body?.users) ? body.users : [];

    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json(
        { ok: false, error: "users  " },
        { status: 400 }
      );
    }

    let upserted = 0;
    let skipped = 0;

    for (const u of list) {
      const name = String(u?.name ?? "").trim();
      const phone = digitsOnly(u?.phone ?? "");
      const role = normalizeRole(u?.role);

      //  :  + 
      if (!name || phone.length < 8) {
        skipped++;
        continue;
      }

      await prisma.user.upsert({
        where: { phone },
        create: {
          name,
          phone,
          role, // Prisma enum(Role)   TS  Prisma 
        },
        update: {
          name,
          role,
          //  loginPinHash  " "   
        },
      });

      upserted++;
    }

    return NextResponse.json({ ok: true, upserted, skipped });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}