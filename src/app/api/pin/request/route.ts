import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 *  PIN   ( dailyPin  )
 * -    
 * -  PIN     Prisma    
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "PIN    .",
    },
    { status: 501 }
  );
}