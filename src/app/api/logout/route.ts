import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  clearSession();

  const url = new URL("/login", req.url);

  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  clearSession();

  const url = new URL("/login", req.url);

  return NextResponse.redirect(url);
}