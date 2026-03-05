import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  clearSession();
  return NextResponse.redirect("/login");
}

export async function POST() {
  clearSession();
  return NextResponse.json({ ok: true });
}