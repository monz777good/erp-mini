import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function GET(req: NextRequest) {
  clearSession();
  return redirectToLogin(req);
}

export async function POST(req: NextRequest) {
  clearSession();
  return redirectToLogin(req);
}