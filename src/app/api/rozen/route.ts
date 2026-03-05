import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 *  rozen()   -   
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  return NextResponse.json(
    { ok: false, message: "Deprecated endpoint." },
    { status: 410 }
  );
}