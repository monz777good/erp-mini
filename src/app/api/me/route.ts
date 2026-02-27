// ✅ 경로: src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, user: null }, { status: 200 });
  return NextResponse.json({ ok: true, user }, { status: 200 });
}