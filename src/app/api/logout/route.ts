import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const res = NextResponse.json({ ok: true });
  clearSession(res);
  return res;
}