// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  return NextResponse.json({ ok: true, user });
}