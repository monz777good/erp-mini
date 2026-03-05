import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

/**
 *   ( ) -   
 * -  export/logen-ship      
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  return NextResponse.json(
    { ok: false, message: "Deprecated endpoint. Use /api/orders/export/logen-ship" },
    { status: 410 }
  );
}