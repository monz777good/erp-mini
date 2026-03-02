import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPinPepper: !!process.env.PIN_PEPPER,
    nodeEnv: process.env.NODE_ENV,
  });
}