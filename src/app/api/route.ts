import { NextResponse } from "next/server";

export const runtime = "nodejs";

//  API   (/ )
// -   ( getSession    )
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "ERP API is running",
  });
}